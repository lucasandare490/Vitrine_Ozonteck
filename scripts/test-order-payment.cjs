const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('app/api/pedidos/[id]/pagamento/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
async function run(options = {}) {
  let lookups = 0;
  const filters = {};
  const order = { id, user_id: 'owner', id_pagamento_mp: '123', checkout_id: 'checkout', status: 'pendente', valor_total: 9.99, ...options.order };
  const payment = { id: 123, external_reference: 'checkout', currency_id: 'BRL', transaction_amount: 9.99, live_mode: true, status: 'pending', payment_method_id: 'pix', payment_type_id: 'bank_transfer', point_of_interaction: { transaction_data: { qr_code: 'fixture-pix' } }, ...options.payment };
  const query = { select() { return this; }, eq(key, value) { filters[key] = value; return this; }, async maybeSingle() { return { data: options.missing ? null : order }; } };
  const mocks = {
    '@supabase/supabase-js': { createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }), getClaims: async () => ({ data: { claims: { aal: 'aal1' } } }) }, from: () => query }) },
    mercadopago: { MercadoPagoConfig: class {}, Payment: class { async get() { lookups++; return payment; } } },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/mfa-policy': { requiresSecondFactor: () => !!options.mfa },
    '@/lib/server/http': { createRateLimitGuard: () => async () => options.rate || 'allowed' },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name], process: { env: { MP_ACCESS_TOKEN: 'fixture', NEXT_PUBLIC_SUPABASE_URL: 'fixture', SUPABASE_SERVICE_ROLE_KEY: 'fixture' } }, URL });
  const response = await exports.GET(new Request('https://example.invalid', { headers: options.anonymous ? {} : { Authorization: 'Bearer fixture' } }), { params: Promise.resolve({ id }) });
  assert.match(response.headers.get('cache-control'), /no-store/);
  return { status: response.status, body: await response.json(), lookups, filters };
}
(async () => {
  for (const [options, expected] of [[{ anonymous: true }, 401], [{ mfa: true }, 403], [{ missing: true }, 404], [{ rate: 'denied' }, 429]]) {
    const result = await run(options); assert.equal(result.status, expected); assert.equal(result.lookups, 0);
  }
  const pix = await run(); assert.equal(pix.body.pixCode, 'fixture-pix'); assert.equal(pix.filters.user_id, 'owner'); assert.equal(pix.filters.id, id);
  for (const payment of [{ transaction_amount: 1 }, { external_reference: 'other' }, { live_mode: false }, { currency_id: 'USD' }]) assert.equal((await run({ payment })).status, 409);
  for (const payment of [{ status: 'approved' }, { status: 'rejected' }, { date_of_expiration: '2020-01-01' }]) {
    const result = await run({ payment }); assert.equal(result.body.payable, false); assert.equal(result.body.pixCode, null);
  }
  const boleto = await run({ payment: { payment_type_id: 'ticket', payment_method_id: 'bolbradesco', barcode: { content: 'fixture-code' }, transaction_details: { external_resource_url: 'https://www.mercadopago.com.br/boleto' } } });
  assert.equal(boleto.body.boletoCode, 'fixture-code'); assert.ok(boleto.body.boletoUrl);
  const unsafe = await run({ payment: { payment_type_id: 'ticket', transaction_details: { external_resource_url: 'https://evil.invalid/boleto' } } });
  assert.equal(unsafe.body.boletoUrl, null);
  console.log('PASS: ownership, MFA, authentication, rate limit, provider reference/amount/environment, Pix/boleto recovery, expiry and approved state. Mocked services; no charges or database writes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
