const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const ts = require('typescript');
const sdk = require('mercadopago');

const code = ts.transpileModule(fs.readFileSync('app/api/webhook/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function run(options = {}) {
  const secret = 'local-fixture-only';
  const requestId = 'fixture-request';
  const id = '123456';
  const timestamp = String(Date.now() - (options.stale ? 1200000 : 0));
  const signature = createHmac('sha256', secret)
    .update(`id:${id};request-id:${requestId};ts:${timestamp};`).digest('hex');
  let lookups = 0;
  const writes = [];
  const mocks = {
    '@supabase/supabase-js': { createClient: () => ({ rpc: async (name, args) => {
      assert.equal(name, 'processar_status_pagamento');
      writes.push(args);
      return options.dbError ? { error: { message: 'fixture failure' } }
        : { data: { pedido_encontrado: !options.missingOrder, estoque_disponivel: !options.noStock } };
    } }) },
    mercadopago: {
      InvalidWebhookSignatureError: sdk.InvalidWebhookSignatureError,
      WebhookSignatureValidator: sdk.WebhookSignatureValidator,
      MercadoPagoConfig: class {},
      Payment: class { async get({ id: paymentId }) {
        lookups++;
        assert.equal(paymentId, id);
        if (options.providerError) throw new Error('fixture failure');
        return { status: 'pending', transaction_amount: 79.96, external_reference: 'fixture-order' };
      } },
    },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    zod: require('zod'),
    '@/lib/server/http': {
      createRateLimitGuard: () => async () => options.rate || 'allowed',
      readJsonBody: request => request.json(),
      RequestBodyError: class extends Error {},
    },
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports, require: name => {
      if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
      return mocks[name];
    },
    process: { env: { MP_WEBHOOK_SECRET: secret, MP_ACCESS_TOKEN: 'fixture',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture' } },
    console: { error() {} }, URL, Request, Response, Headers,
  });
  const response = await exports.POST(new Request(`https://example.invalid/api/webhook?data.id=${id}`, {
    method: 'POST',
    headers: options.noSignature ? {} : { 'x-request-id': requestId,
      'x-signature': `ts=${timestamp},v1=${options.badSignature ? '0'.repeat(64) : signature}` },
    body: JSON.stringify({ type: 'payment', data: { id: options.mismatch ? '987' : id }, status: 'approved' }),
  }));
  return { status: response.status, body: await response.json(), lookups, writes };
}

(async () => {
  for (const [options, status] of [
    [{ noSignature: true }, 403], [{ badSignature: true }, 401],
    [{ stale: true }, 401], [{ mismatch: true }, 400],
    [{ rate: 'denied' }, 429], [{ rate: 'unavailable' }, 503],
  ]) {
    const result = await run(options);
    assert.equal(result.status, status);
    assert.equal(result.lookups, 0);
    assert.equal(result.writes.length, 0);
  }
  const valid = await run();
  assert.equal(valid.status, 200);
  assert.equal(valid.writes.length, 1);
  assert.equal(valid.writes[0].p_payment_status, 'pending');
  assert.equal(valid.writes[0].p_amount, 79.96);
  assert.equal(valid.writes[0].p_checkout_id, 'fixture-order');
  const failedLookup = await run({ providerError: true });
  assert.equal(failedLookup.status, 500);
  assert.equal(failedLookup.writes.length, 0);
  assert.equal((await run({ dbError: true })).status, 500);
  assert.equal((await run({ missingOrder: true })).status, 409);
  assert.equal((await run({ noStock: true })).body.requires_review, true);
  console.log('PASS: actual SDK signature verification, stale/forged signatures, ID mismatch, rate-limit failures, authoritative provider status/amount, lookup/DB failure, missing order and stock review. Provider and DB mocked; no network or charges. DB replay/idempotency is not covered.');
})().catch(error => { console.error(error); process.exitCode = 1; });
