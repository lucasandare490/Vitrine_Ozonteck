import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Entirely in memory: no Supabase credentials, network or external DB writes.
const db = new PGlite();
const admin = '00000000-0000-0000-0000-000000000001';
const customer = '00000000-0000-0000-0000-000000000002';
const migration = 'supabase/migrations/202611040003_pickup_ready.sql';
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const actor = async (id = '', role = 'authenticated') => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec(`set role ${role}`);
};
const owner = () => actor('', 'postgres');
const order = async (overrides = {}) => {
  await owner();
  const values = { status: 'preparando', payment: 'approved', address: { modalidade: 'retirada' }, ...overrides };
  return (await db.query(`insert into pedidos(user_id,status,status_pagamento,endereco_entrega,
    itens,valor_total,estoque_baixado) values($1,$2,$3,$4,'[]',10,true) returning id`,
  [customer, values.status, values.payment, values.address])).rows[0].id;
};
const ready = id => db.query('update pedidos set retirada_pronta_em=clock_timestamp() where id=$1', [id]);
const row = async id => {
  await owner();
  return (await db.query('select * from pedidos where id=$1', [id])).rows[0];
};
const emails = async id => {
  await owner();
  return (await db.query("select * from customer_email_outbox where pedido_id=$1 and event='pickup_ready'", [id])).rows;
};
const denied = async (query, code, message) => {
  await assert.rejects(query(), error => error.code === code, message);
  checks++;
};

try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,service_role;
    create table profiles(id uuid primary key,role text);
    create table produtos(code text primary key,estoque integer,is_deleted boolean);
    create table pedidos(id uuid primary key default gen_random_uuid(),user_id uuid,
      status text,status_pagamento text,endereco_entrega jsonb,id_pagamento_mp text,
      checkout_id text,itens jsonb,valor_total numeric,estoque_baixado boolean,reserva_expira_em timestamptz);
    create table pedido_alteracoes(id uuid primary key,user_id uuid,novo_pedido_id uuid);
  `);
  // Reuse the installed authorization function and order policies, not a fake admin flag.
  const setup = await readFile('supabase/migrations/202609240001_ozonteck_complete_setup.sql', 'utf8');
  await db.exec(setup.match(/create or replace function public\.is_admin\(\)[\s\S]*?grant execute on function public\.is_admin\(\) to anon, authenticated, service_role;/)[0]);
  await db.exec(`alter table pedidos enable row level security;
    grant select,update on pedidos to authenticated;
    grant all on pedidos,produtos to service_role;`);
  await db.exec(setup.match(/create policy orders_owner_read[\s\S]*?with check \(public\.is_admin\(\)\);/)[0]);
  await db.query('insert into auth.users values ($1,null),($2,null)', [admin, customer]);
  await db.query("insert into profiles values ($1,'admin'),($2,'cliente')", [admin, customer]);
  await db.exec(await readFile('supabase/migrations/202610130002_payment_lifecycle.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/202611010001_customer_email_outbox.sql', 'utf8'));
  const historical = await order();
  const pickupSql = await readFile(migration, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  if (pickupSql) await db.exec(pickupSql);
  check((await db.query("select 1 from information_schema.columns where table_name='pedidos' and column_name='retirada_pronta_em' and data_type='timestamp with time zone'")).rows.length === 1,
    'Migration must add pedidos.retirada_pronta_em timestamptz');
  check((await row(historical)).retirada_pronta_em === null && (await emails(historical)).length === 0,
    'Migration does not mark or notify historical purchases');

  // Actual payment reconciliation must never mark a pickup ready.
  const paid = await order({ status: 'pending', payment: 'pending' });
  await actor('', 'service_role');
  await db.query("update pedidos set id_pagamento_mp='PAY-READY' where id=$1", [paid]);
  await db.query("select processar_status_pagamento('PAY-READY','approved',null,10)");
  check((await row(paid)).status === 'preparando', 'Payment approval advances preparation');
  check((await row(paid)).retirada_pronta_em === null, 'Payment approval does not mark ready');
  check((await emails(paid)).length === 0, 'Payment approval does not queue pickup_ready');

  await actor(customer);
  check((await db.query('select id from pedidos where id=$1', [paid])).rows.length === 1, 'Customer can read own order');
  check((await ready(paid)).affectedRows === 0, 'Existing RLS prevents customer order updates');
  await actor('', 'service_role');
  await denied(() => ready(paid), '42501', 'Service role cannot mark ready');
  await owner();
  await denied(() => ready(paid), '42501', 'Owner without an admin identity cannot mark ready');
  // Deliberately allow updates under RLS to prove the trigger independently guards writes.
  await db.exec('create policy test_permissive_update on pedidos for update to authenticated using(true) with check(true)');
  await actor(customer);
  await denied(() => ready(paid), '42501', 'Trigger rejects customer even with permissive RLS');
  await owner();
  await db.exec('drop policy test_permissive_update on pedidos');

  for (const invalid of [
    { status: 'pending' }, { status: 'enviado' }, { status: 'entregue' },
    { status: 'cancelado' }, { status: 'reembolsado' }, { status: null },
    { payment: 'pending' }, { payment: 'refunded' }, { payment: 'charged_back' }, { payment: null },
    { address: { modalidade: 'entrega' } }, { address: {} }, { address: null },
  ]) {
    const id = await order(invalid);
    await actor(admin);
    await denied(() => ready(id), '23514', `Invalid ready state: ${JSON.stringify(invalid)}`);
    check((await emails(id)).length === 0, 'Invalid mark does not create an email');
  }

  await actor(admin);
  await ready(paid);
  check((await row(paid)).retirada_pronta_em !== null, 'Admin can explicitly mark ready');
  check((await emails(paid)).length === 1, 'Admin mark queues pickup_ready');
  await actor(admin);
  await ready(paid);
  await db.query('update pedidos set valor_total=valor_total where id=$1', [paid]);
  check((await emails(paid)).length === 1, 'Repeated marks and unrelated updates deduplicate');
  await actor('', 'service_role');
  await denied(() => db.query('update pedidos set retirada_pronta_em=null where id=$1', [paid]), '42501', 'Service role cannot explicitly clear ready');
  await denied(() => ready(paid), '42501', 'Service role cannot change ready timestamp');
  const readyAt = (await row(paid)).retirada_pronta_em;
  await actor('', 'service_role');
  await db.query("select processar_status_pagamento('PAY-READY','approved',null,10)");
  check(new Date((await row(paid)).retirada_pronta_em).getTime() === new Date(readyAt).getTime(), 'Repeated approval preserves existing explicit readiness');
  check((await emails(paid)).length === 1, 'Repeated approval does not duplicate pickup notice');

  // Real refunds use multiple UPDATEs; clearing must not block reconciliation.
  await actor('', 'service_role');
  await db.query("select processar_status_pagamento('PAY-READY','refunded',null,10)");
  check((await row(paid)).retirada_pronta_em === null, 'Refund clears ready timestamp');
  check((await row(paid)).status === 'reembolsado', 'Refund reconciliation remains functional');
  check((await emails(paid))[0].state === 'skipped', 'Refund invalidates pending pickup email');

  for (const invalidation of [
    "status='entregue'", "status='enviado'", "status='cancelado'", "status_pagamento='charged_back'",
    "endereco_entrega='{\"modalidade\":\"entrega\"}'", "endereco_entrega=null", 'status=null',
  ]) {
    const id = await order();
    await actor(admin);
    await ready(id);
    await owner();
    await db.query("update customer_email_outbox set state='sending',lease=gen_random_uuid(),locked_until=now()+interval '5 minutes' where pedido_id=$1 and event='pickup_ready'", [id]);
    await actor('', 'service_role');
    await db.query(`update pedidos set ${invalidation} where id=$1`, [id]);
    check((await row(id)).retirada_pronta_em === null, `Automatic invalidation: ${invalidation}`);
    const email = (await emails(id))[0];
    check(email.state === 'skipped' && email.lease === null && email.locked_until === null, 'Stale sending email loses its lease');
  }

  const revoked = await order();
  await actor(admin);
  await ready(revoked);
  await db.query('update pedidos set retirada_pronta_em=null where id=$1', [revoked]);
  check((await emails(revoked))[0].state === 'skipped', 'Admin revoke suppresses unsent notification');
  await actor(admin);
  await ready(revoked);
  check((await emails(revoked)).length === 1, 'Re-marking never creates a second notification');
  check((await emails(revoked))[0].state === 'skipped', 'Old notification is never revived');

  const sent = await order();
  await actor(admin);
  await ready(sent);
  await owner();
  await db.query("update customer_email_outbox set state='sent',sent_at=now() where pedido_id=$1 and event='pickup_ready'", [sent]);
  await actor('', 'service_role');
  await db.query("update pedidos set status='entregue' where id=$1", [sent]);
  check((await emails(sent))[0].state === 'sent', 'Invalidation preserves already-sent history');
  await actor(admin);
  await db.query("update pedidos set status='preparando' where id=$1", [sent]);
  check((await row(sent)).retirada_pronta_em === null, 'Returning to preparation requires a fresh explicit mark');

  const finalState = await order();
  await actor(admin);
  await db.exec('begin');
  await ready(finalState);
  await db.query("update pedidos set status='entregue' where id=$1", [finalState]);
  await db.exec('commit');
  check((await emails(finalState)).length === 0, 'Deferred trigger uses final transaction state');

  const rolledBack = await order();
  await actor(admin);
  await db.exec('begin');
  await ready(rolledBack);
  await db.exec('rollback');
  check((await row(rolledBack)).retirada_pronta_em === null && (await emails(rolledBack)).length === 0, 'Rollback leaves no timestamp or notification');

  // Inserts are guarded too, including privileged backend inserts.
  await actor('', 'service_role');
  await denied(() => db.query(`insert into pedidos(user_id,status,status_pagamento,endereco_entrega,retirada_pronta_em)
    values($1,'preparando','approved','{"modalidade":"retirada"}',now())`, [customer]), '42501', 'Backend insert cannot pre-mark ready');
  await owner();
  await db.query("insert into customer_email_outbox(dedupe_key,user_id,event) values('support-compatible',$1,'support_received')", [customer]);
  check(true, 'Event check accepts support_received for migration 0004');
  await denied(() => db.query("insert into customer_email_outbox(dedupe_key,user_id,event) values('invalid',$1,'unknown')", [customer]), '23514', 'Event check still rejects unknown events');
  check((await db.query("select has_function_privilege('authenticated','public.guard_pickup_ready()','EXECUTE') as allowed")).rows[0].allowed === false, 'Clients cannot invoke guard function');
  console.log(`Pickup readiness: ${checks} PGlite checks passed (authorization, eligibility, approval, refund, invalidation, deduplication, deferred state, rollback, outbox compatibility).`);
} finally {
  await db.close();
}
