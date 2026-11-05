// Reads only the explicit test file. No production environment or shop database.
import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { MercadoPagoConfig, Order } from 'mercadopago';
const env = parseEnv(await readFile('.env.orders-test.local', 'utf8'));
const headers = { Authorization: 'Bearer ' + env.ORDERS_TEST_ACCESS_TOKEN };
const identity = await (await fetch('https://api.mercadopago.com/users/me', { headers, signal: AbortSignal.timeout(15000) })).json();
if (!identity.tags?.includes('test_user')) throw new Error('REFUSING_NON_TEST_ACCOUNT');
const source = JSON.parse(await readFile('docs/payment-provider-test-2026-11-05.json', 'utf8'));
const client = new Order(new MercadoPagoConfig({ accessToken: env.ORDERS_TEST_ACCESS_TOKEN, options: { timeout: 15000 } }));
const results = [];
for (const [scenario, action, expected, initial] of [
  ['boleto', 'cancel', 'canceled', 'action_required'],
  ['credit-approved', 'refund', 'refunded', 'processed'],
]) {
  const row = source.cases.find(item => item.scenario === scenario);
  if (!row || !/^ORDTST[A-Z0-9]+$/.test(row.orderId || '')) throw new Error('EXPLICIT_TEST_ORDER_REQUIRED');
  const result = { scenario, action, orderId: row.orderId };
  try {
    let order = await client.get({ id: row.orderId });
    if (order.user_id !== String(identity.id) || order.external_reference !== row.reference) throw new Error('TEST_ORDER_IDENTITY_MISMATCH');
    result.before = order.status;
    if (order.status !== expected) {
      if (order.status !== initial) throw new Error('UNEXPECTED_TEST_STATUS');
      await client[action]({ id: row.orderId, requestOptions: { idempotencyKey: action + '-' + row.orderId } });
    }
    order = await client.get({ id: row.orderId });
    result.after = order.status; result.detail = order.status_detail;
    result.confirmed = order.status === expected;
  } catch (error) {
    result.confirmed = false;
    result.error = /^[A-Z_]+$/.test(error.message || '') ? error.message : 'TEST_OPERATION_FAILED';
  }
  results.push(result); console.log(JSON.stringify(result));
}
await writeFile('docs/payment-management-test-2026-11-05.json', JSON.stringify({ date: new Date().toISOString(), environment: 'test', testSellerConfirmed: true, scope: 'Official SDK against preexisting fictitious Orders only; no shop DB or real payments.', results }, null, 2) + '\n');
if (results.some(item => !item.confirmed)) process.exitCode = 1;
