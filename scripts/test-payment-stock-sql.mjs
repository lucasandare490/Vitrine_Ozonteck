import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
try {
  await db.exec(`
    create role service_role;
    create table produtos(code text primary key, estoque integer not null, is_deleted boolean default false);
    create table pedidos(id uuid primary key default gen_random_uuid(), user_id uuid,
      checkout_id text unique, id_pagamento_mp text unique, valor_total numeric,
      status text, status_pagamento text, endereco_entrega jsonb, itens jsonb,
      estoque_baixado boolean default false, reserva_expira_em timestamptz);
    insert into produtos values('QA',10,false);
  `);
  const source = await fs.readFile('supabase/migrations/202609240002_security_hardening.sql','utf8');
  const start = source.indexOf('create or replace function public.liberar_reservas_expiradas()');
  const end = source.indexOf('\ncommit;', start);
  assert.ok(start >= 0 && end > start);
  await db.exec(source.slice(start, end));
  await db.exec(await fs.readFile('supabase/migrations/202610130002_payment_lifecycle.sql', 'utf8'));
  const stock = async () => (await db.query("select estoque from produtos where code='QA'")).rows[0].estoque;
  const reserve = id => db.query('select reservar_pedido_checkout($1,null,79.96,$2,$3,30)',
    [id, '{}', JSON.stringify([{code:'QA',qtd:2,preco_unitario:39.98}])]);
  const processPayment = async (id, status, amount=79.96) => (await db.query(
    'select processar_status_pagamento($1,$2,$3,$4) result', ['payment-'+id,status,id,amount])).rows[0].result;
  await reserve('approved'); await reserve('approved');
  assert.equal(await stock(),8);
  await processPayment('approved','approved'); await processPayment('approved','approved');
  assert.equal(await stock(),8);
  await reserve('rejected');
  for (const stage of ['enviado', 'entregue']) {
    await db.query('update pedidos set status=$1 where checkout_id=$2', [stage, 'approved']);
    await processPayment('approved', 'approved');
    assert.equal((await db.query("select status from pedidos where checkout_id='approved'")).rows[0].status, stage);
  }
  await processPayment('approved', 'pending');
  assert.equal((await db.query("select status_pagamento from pedidos where checkout_id='approved'")).rows[0].status_pagamento, 'approved');
  const beforeRefund = await stock();
  await processPayment('approved', 'refunded');
  await processPayment('approved', 'refunded');
  await processPayment('approved', 'approved');
  assert.equal(await stock(), beforeRefund);
  assert.equal((await db.query("select status from pedidos where checkout_id='approved'")).rows[0].status, 'reembolsado');
  assert.equal(await stock(),6);
  await processPayment('rejected','rejected'); await processPayment('rejected','rejected');
  assert.equal(await stock(),8);
  await reserve('expired');
  await db.exec("update pedidos set reserva_expira_em=now()-interval '1 minute' where checkout_id='expired'");
  await db.exec('select liberar_reservas_expiradas(); select liberar_reservas_expiradas()');
  assert.equal(await stock(),8);
  await processPayment('expired','approved'); await processPayment('expired','approved');
  assert.equal(await stock(),6);
  await reserve('wrong-amount');
  const mismatch = await processPayment('wrong-amount','approved',0.01);
  assert.equal(mismatch.valor_valido,false);
  assert.equal((await db.query("select status from pedidos where checkout_id='wrong-amount'")).rows[0].status,'revisao_pagamento');
  assert.equal(await stock(),4);
  await assert.rejects(db.query("select processar_status_pagamento('different-payment','approved','approved',79.96)"));
  assert.equal((await processPayment('unknown','approved')).pedido_encontrado,false);
  await reserve('late-no-stock');
  await db.exec("update pedidos set reserva_expira_em=now()-interval '1 minute' where checkout_id='late-no-stock'; select liberar_reservas_expiradas(); update produtos set estoque=0 where code='QA'");
  assert.equal((await processPayment('late-no-stock','approved')).estoque_disponivel,false);
  assert.equal(await stock(),0);
  console.log('PASS: reservation/approval/rejection/expiry replay, shipped/delivered preservation, stale pending, refund replay, no automatic return stock, late approval, amount mismatch, foreign payment, missing order and insufficient stock. Local PostgreSQL only; remote concurrency not covered.');
} finally { await db.close(); }
