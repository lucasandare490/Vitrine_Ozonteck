import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
import vm from 'node:vm';
import { normalizeOrdersResponse } from '../lib/server/mercado-pago-orders.ts';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const sdk = require('mercadopago');
const code = ts.transpileModule(readFileSync('app/api/webhook/orders/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

async function run(options: { signature?: boolean; stale?: boolean; bodyId?: string; sandbox?: boolean; foreign?: boolean; method?: string; providerStatus?: string; rate?: string; missing?: boolean; noStock?: boolean; partial?: boolean } = {}) {
  const id = 'ORDFIXTURE001', requestId = 'request-fixture', secret = 'secret-fixture';
  const timestamp = String(Date.now() - (options.stale ? 1200000 : 0));
  const signature = createHmac('sha256', secret).update(`id:${id};request-id:${requestId};ts:${timestamp};`).digest('hex');
  let reads = 0;
  const reconciled: unknown[] = [];
  const raw = { id, type: 'online', external_reference: 'orders-reference-fixture', user_id: options.foreign ? 'foreign-account' : 'account-fixture', integration_data: { application_id: 'app-fixture' }, country_code: 'BRA', currency: 'BRL', total_amount: '9.99', total_paid_amount: '9.99', status: options.providerStatus || 'processed', status_detail: options.partial ? 'partially_refunded' : 'accredited', transactions: { payments: [{ amount: '9.99', payment_method: { id: options.method === 'boleto' ? 'boleto' : options.method === 'pix' ? 'pix' : 'visa', type: options.method === 'boleto' ? 'ticket' : options.method === 'pix' ? 'bank_transfer' : options.method || 'credit_card' } }] } };
  const mocks = {
    '@supabase/supabase-js': { createClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: options.missing ? null : { id: 'order-fixture', checkout_id: raw.external_reference, valor_total: 9.99, id_pagamento_mp: id } }) }) }) }) }) },
    mercadopago: { InvalidWebhookSignatureError: sdk.InvalidWebhookSignatureError, WebhookSignatureValidator: sdk.WebhookSignatureValidator },
    'next/server': { NextResponse: { json: (body: unknown, init: ResponseInit) => Response.json(body, init) } },
    zod: require('zod'),
    '@/lib/server/http': { createRateLimitGuard: () => async () => options.rate || 'allowed', readJsonBody: (request: Request) => request.json(), RequestBodyError: class extends Error {} },
    '@/lib/server/mercado-pago-orders': { normalizeOrdersResponse },
    '@/lib/server/orders-provider': {
      ordersClient: () => ({ get: async () => { reads++; return raw; } }),
      validateOrdersBinding: async () => ({ accountId: 'account-fixture', applicationId: 'app-fixture', reference: raw.external_reference, totalInCents: 999 }),
      reconcileOrdersPayment: async (_db: unknown, _order: unknown, payment: { partiallyRefunded: boolean }) => {
        if (payment.partiallyRefunded) throw new Error('PARTIAL_REFUND_REQUIRES_REVIEW');
        reconciled.push(payment); return { estoque_disponivel: !options.noStock };
      },
    },
  };
  const exported: { POST?: (request: Request) => Promise<Response> } = {};
  vm.runInNewContext(code, { exports: exported, URL, Date, process: { env: { MP_ORDERS_WEBHOOK_SECRET: secret, NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture' } }, require: (name: keyof typeof mocks) => { assert.ok(name in mocks); return mocks[name]; } });
  const response = await exported.POST!(new Request(`https://store.example.invalid/api/webhook/orders?data.id=${id}`, {
    method: 'POST', headers: { 'x-request-id': requestId, 'x-signature': `ts=${timestamp},v1=${options.signature === false ? '0'.repeat(64) : signature}` },
    body: JSON.stringify({ type: 'order', live_mode: !options.sandbox, data: { id: options.bodyId || id }, status: 'approved' }),
  }));
  return { status: response.status, body: await response.json(), reads, reconciled };
}

test('Orders webhook verifies real SDK signatures and rejects stale, mismatched, sandbox and rate-limited events before reads', async () => {
  for (const [options, expected] of [[{ signature: false }, 401], [{ stale: true }, 401], [{ bodyId: 'ORDOTHER' }, 400], [{ sandbox: true }, 400], [{ rate: 'denied' }, 429], [{ rate: 'unavailable' }, 503]] as const) {
    const result = await run(options); assert.equal(result.status, expected); assert.equal(result.reads, 0); assert.equal(result.reconciled.length, 0);
  }
});

test('each method reconciles only the authenticated provider status, never the webhook body status', async () => {
  for (const method of ['pix', 'boleto', 'credit_card', 'debit_card']) {
    const result = await run({ method, providerStatus: 'processing' });
    assert.equal(result.status, 200); assert.equal(result.reads, 1);
    const payment = result.reconciled[0] as { status: string; amount: number };
    assert.equal(payment.status, 'in_process'); assert.equal(payment.amount, 9.99);
  }
});

test('foreign account, unknown provider states and missing orders cannot settle a sale', async () => {
  for (const options of [{ foreign: true }, { providerStatus: 'unknown' }, { missing: true }, { partial: true }]) {
    const result = await run(options); assert.ok(result.status >= 400); assert.equal(result.reconciled.length, 0);
  }
  assert.equal((await run({ noStock: true })).body.requires_review, true);
});
