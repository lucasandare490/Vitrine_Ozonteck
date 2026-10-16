import fs from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Never load .env or accept a production token for this test runner.
const env = parseEnv(await fs.readFile('.env.payment-test', 'utf8'));
assert.ok(env.MP_ACCESS_TOKEN?.startsWith('TEST-'), 'TEST token required');
assert.ok(env.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith('TEST-'), 'TEST public key required');
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
async function request(path, body) {
  const publicTokenization = path === '/v1/card_tokens' && process.argv.includes('--public-tokenization');
  const url = new URL(`https://api.mercadopago.com${path}`);
  if(publicTokenization) url.searchParams.set('public_key',env.NEXT_PUBLIC_MP_PUBLIC_KEY);
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { ...(!publicTokenization ? {Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`} : {}), 'Content-Type':'application/json',
      ...(body ? { 'X-Idempotency-Key':randomUUID() } : {}) },
    ...(body ? {body:JSON.stringify(body)} : {}), signal:AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify({path,http:response.status,requestId:response.headers.get('x-request-id'),error:data.error,message:data.message,
    causes:data.cause?.map(c=>({code:c.code,description:c.description}))}));
  return data;
}
const results = [];
let failure = null;
try {
  await db.exec(`create role service_role;
    create table produtos(code text primary key, estoque integer, is_deleted boolean default false);
    create table pedidos(id uuid primary key default gen_random_uuid(), user_id uuid, checkout_id text unique,
      id_pagamento_mp text unique, valor_total numeric, status text, status_pagamento text,
      endereco_entrega jsonb,itens jsonb,estoque_baixado boolean default false,reserva_expira_em timestamptz);
    insert into produtos values('QA',10,false);`);
  const sql = await fs.readFile('supabase/migrations/202609240002_security_hardening.sql','utf8');
  const start = sql.indexOf('create or replace function public.liberar_reservas_expiradas()');
  const end = sql.indexOf('\ncommit;',start);
  assert.ok(start >= 0 && end > start);
  await db.exec(sql.slice(start,end));
  for (const [name,expected] of (process.argv.includes('--probe') ? [['APRO','approved']] : [['APRO','approved'],['OTHE','rejected'],['CONT','in_process']])) {
    const reference = `sandbox-${randomUUID()}`;
    const card = await request('/v1/card_tokens', {
      card_number:process.argv.includes('--visa')?'4235647728025682':'5480832801033311',security_code:'123',expiration_month:11,expiration_year:2030,
      cardholder:{name,identification:{type:'CPF',number:'12345678909'}},
    });
    const before = (await db.query("select estoque from produtos where code='QA'")).rows[0].estoque;
    await db.query('select reservar_pedido_checkout($1,null,79.96,$2,$3,30)',
      [reference,'{}',JSON.stringify([{code:'QA',qtd:1,preco_unitario:79.96}])]);
    const payment = await request('/v1/payments', {
      transaction_amount:79.96,token:card.id,description:'Homologacao isolada - sem entrega',installments:1,
      payment_method_id:process.argv.includes('--visa')?'visa':'master',external_reference:reference,
      payer:{email:process.argv.includes('--fresh-payer')?`qa.${randomUUID()}@example.com`:process.argv.includes('--test-email')?'test_user_ozonteck@testuser.com':'qa.sandbox.ozonteck@example.com',identification:{type:'CPF',number:'12345678909'}},
    });
    assert.equal(payment.live_mode,false,'Payment must remain in sandbox');
    assert.equal(payment.status,expected);
    const confirmed = await request(`/v1/payments/${payment.id}`);
    assert.equal(confirmed.live_mode,false);
    assert.equal(confirmed.transaction_amount,79.96);
    for(let repeat=0;repeat<2;repeat++) await db.query('select processar_status_pagamento($1,$2,$3,$4)',
      [String(confirmed.id),confirmed.status,confirmed.external_reference,confirmed.transaction_amount]);
    const after = (await db.query("select estoque from produtos where code='QA'")).rows[0].estoque;
    assert.equal(after,expected==='rejected'?before:before-1);
    const result={scenario:name,status:confirmed.status,liveMode:confirmed.live_mode,paymentId:confirmed.id,
      stockBefore:before,stockAfter:after};
    results.push(result); console.log(JSON.stringify(result));
  }
  console.log(`PASS: ${results.length} sandbox scenario(s) + read-back + real SQL in temporary DB; public webhook and storefront checkout NOT exercised.`);
} catch (error) {
  failure = error.message;
  console.error(failure);
  process.exitCode = 1;
} finally {
  await fs.writeFile('docs/payment-sandbox-latest-results.json',JSON.stringify({checkedAt:new Date().toISOString(),
    scope:'Provider sandbox and temporary SQL only; no public webhook or storefront checkout',
    options:process.argv.slice(3),failure,results},null,2)+'\n');
  await db.close();
}
