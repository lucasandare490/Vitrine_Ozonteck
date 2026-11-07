import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
try {
  await db.exec(`create role service_role; create role authenticated; create role anon;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    create function public.is_admin() returns boolean language sql as $$ select false $$;
    create function public.account_mfa_allowed() returns boolean language sql as $$ select true $$;
    create table profiles(id uuid primary key,role text);
    create table produtos(code text primary key, price numeric, estoque integer, is_deleted boolean default false);
    create table pedidos(id uuid primary key default gen_random_uuid(),user_id uuid,checkout_id text unique,id_pagamento_mp text,status text,status_pagamento text,itens jsonb,endereco_entrega jsonb,valor_total numeric,estoque_baixado boolean,reserva_expira_em timestamptz);
    insert into auth.users values('10000000-0000-0000-0000-000000000001');
    insert into produtos values('QA',5,8,false);`);
  const migration = name => fs.readFile('supabase/migrations/' + name + '.sql','utf8');
  const hardening = await migration('202609240002_security_hardening');
  await db.exec(hardening.slice(hardening.indexOf('create or replace function public.liberar_reservas_expiradas()'), hardening.lastIndexOf('commit;')));
  await db.exec(await migration('202610090001_affiliate_pricing'));
  await db.exec(await migration('202610140001_order_changes'));
  await db.exec(await migration('202611070002_atomic_order_change_reservation'));
  const user='10000000-0000-0000-0000-000000000001';
  const old=(await db.query(`insert into pedidos(user_id,id_pagamento_mp,status,status_pagamento,itens,endereco_entrega,valor_total,estoque_baixado) values($1,'123','pending','pending','[{"code":"QA","qtd":2}]','{}',10,true) returning id`,[user])).rows[0].id;
  const reopen=()=>db.query('select reabrir_compra_cancelada($1,$2,$3,$4) as result',[old,user,'123','pagamento']);
  const change=(await reopen()).rows[0].result;
  assert.equal((await reopen()).rows[0].result.id,change.id);
  assert.equal((await db.query('select estoque from produtos')).rows[0].estoque,10);
  const reserve = (key, changeId = change.id, owner = user) => db.query(
    'select reserve_changed_order($1,$2,10,$3,$4,30,$5) as result',
    [key,owner,'{}',JSON.stringify([{code:'QA',qtd:2,preco_unitario:5}]),changeId],
  );
  const newer = (await reserve('replacement')).rows[0].result.id;
  assert.equal((await reserve('replacement')).rows[0].result.id,newer);
  assert.equal((await db.query('select novo_pedido_id from pedido_alteracoes where id=$1',[change.id])).rows[0].novo_pedido_id,newer);
  await assert.rejects(reserve('replacement-duplicate'),/CHANGE_ALREADY_USED/);
  await assert.rejects(reserve('replacement-foreign',change.id,'20000000-0000-0000-0000-000000000001'),/CHANGE_ALREADY_USED/);
  assert.equal((await db.query('select estoque from produtos')).rows[0].estoque,8);
  assert.equal((await db.query('select count(*)::int as count from pedidos')).rows[0].count,2);
  await assert.rejects(db.query('select reabrir_compra_cancelada($1,$2,$3,$4)',[old,'20000000-0000-0000-0000-000000000001','123','dados']));
  await db.query("update pedidos set id_pagamento_mp='456',status='preparando',status_pagamento='approved' where id=$1",[newer]);
  await assert.rejects(db.query('select reabrir_compra_cancelada($1,$2,$3,$4)',[newer,user,'456','endereco']));
  assert.equal((await db.query("select has_function_privilege('authenticated','reabrir_compra_cancelada(uuid,uuid,text,text)','EXECUTE') as allowed")).rows[0].allowed,false);
  console.log('PASS local SQL: ownership, approved block, one stock return, atomic reservation/link, replay and rollback for foreign or duplicate replacement.');
} finally { await db.close(); }
