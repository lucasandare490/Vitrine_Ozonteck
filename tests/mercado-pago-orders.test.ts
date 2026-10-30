import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOrdersRequest, normalizeOrdersResponse, normalizeOrdersStatus,
  type OrdersCheckoutInput, type OrdersIdentity,
} from '../lib/server/mercado-pago-orders.ts';

const input: OrdersCheckoutInput = {
  totalInCents: 999,
  reference: 'checkout-example-0001',
  description: 'Produto ficticio',
  method: 'pix',
  payer: {
    email: 'payer@example.com', first_name: 'Teste', last_name: 'Local',
    identification: { type: 'CPF', number: '00000000000' },
    address: { zip_code: '50000000', street_name: 'Rua de teste', street_number: '1', neighborhood: 'Centro', city: 'Recife', federal_unit: 'pe' },
  },
};
const expected: OrdersIdentity = {
  id: 'ORDTEST001', reference: input.reference, totalInCents: 999,
  accountId: 'account-test', applicationId: 'app-test',
};
function response() {
  return {
    id: expected.id, type: 'online', external_reference: expected.reference,
    country_code: 'BRA', currency: 'BRL', user_id: expected.accountId,
    integration_data: { application_id: expected.applicationId },
    status: 'action_required', status_detail: 'waiting_payment', total_amount: '9.99', total_paid_amount: '0.00',
    transactions: { payments: [{
      amount: '9.99', date_of_expiration: '2026-10-23T15:00:00Z',
      payment_method: { id: 'pix', type: 'bank_transfer', qr_code: 'test-pix', qr_code_base64: 'test-image' },
    }] },
  };
}

test('Orders request uses decimal strings, new methods and state field', () => {
  const pix = buildOrdersRequest(input);
  assert.equal(pix.total_amount, '9.99');
  assert.equal(pix.processing_mode, 'automatic');
  assert.equal(pix.payer?.address?.state, 'PE');
  assert.equal('federal_unit' in pix.payer!.address!, false);
  assert.deepEqual(pix.transactions?.payments?.[0].payment_method, { id: 'pix', type: 'bank_transfer' });
  assert.deepEqual(buildOrdersRequest({ ...input, method: 'boleto' }).transactions?.payments?.[0].payment_method,
    { id: 'boleto', type: 'ticket' });
  assert.equal('notification_url' in pix, false);
  assert.equal('expiration_time' in pix, false);
});

test('card request requires token, method type and valid installments', () => {
  const card = { id: 'visa', token: 'fake-token', installments: 12 };
  const body = buildOrdersRequest({ ...input, method: 'credit_card', card });
  assert.deepEqual(body.transactions?.payments?.[0].payment_method, { ...card, type: 'credit_card' });
  assert.throws(() => buildOrdersRequest({ ...input, method: 'credit_card' }), /INVALID_CARD/);
  assert.throws(() => buildOrdersRequest({ ...input, method: 'debit_card', card }), /INVALID_CARD/);
  assert.throws(() => buildOrdersRequest({ ...input, method: 'credit_card', card: { ...card, installments: 13 } }), /INVALID_CARD/);
  assert.equal(buildOrdersRequest({ ...input, method: 'debit_card', card: { ...card, installments: 1 } }).transactions?.payments?.[0].payment_method?.type, 'debit_card');
});

test('request rejects invalid amounts and references', () => {
  for (const totalInCents of [0, -1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => buildOrdersRequest({ ...input, totalInCents }), /INVALID_ORDER_AMOUNT/);
  }
  assert.throws(() => buildOrdersRequest({ ...input, reference: '../order' }), /INVALID_ORDER_REFERENCE/);
});

test('all supported states map without converting pending into approval', () => {
  for (const [state, detail, result] of [
    ['created', 'created', 'pending'], ['processed', 'accredited', 'approved'],
    ['processing', 'in_process', 'in_process'], ['action_required', 'waiting_payment', 'pending'],
    ['action_required', 'waiting_capture', 'authorized'], ['action_required', 'waiting_retry', 'pending'],
    ['failed', 'failed', 'rejected'], ['canceled', 'expired', 'cancelled'],
    ['refunded', 'refunded', 'refunded'], ['charged_back', 'in_process', 'in_mediation'],
    ['charged_back', 'settled', 'charged_back'], ['charged_back', 'reimbursed', 'charged_back'],
  ]) assert.equal(normalizeOrdersStatus(state, detail), result);
  assert.throws(() => normalizeOrdersStatus('new_status', undefined), /UNSUPPORTED_ORDER_STATUS/);
});

test('Pix data is normalized without exposing payer, token or raw response', () => {
  const result = normalizeOrdersResponse(response(), expected);
  assert.equal(result.status, 'pending');
  assert.equal(result.pixCode, 'test-pix');
  assert.equal(result.pixImage, 'test-image');
  assert.equal(result.expiresAt, '2026-10-23T15:00:00.000Z');
  assert.equal(result.boletoUrl, null);
  assert.equal('payer' in result, false);
  assert.equal('transactions' in result, false);
});

test('foreign account, app, currency, order, reference and amount are rejected', () => {
  for (const patch of [
    { user_id: 'other' }, { integration_data: { application_id: 'other' } },
    { currency: 'USD' }, { country_code: 'ARG' }, { type: 'point' },
    { id: 'ORDOTHER' }, { external_reference: 'other' }, { total_amount: '10.00' },
    { total_amount: '9.9901' }, { total_amount: 'NaN' }, { total_amount: '1e2' },
  ]) assert.throws(() => normalizeOrdersResponse({ ...response(), ...patch }, expected));
  assert.throws(() => normalizeOrdersResponse(response(), { ...expected, accountId: '' }));
  assert.throws(() => normalizeOrdersResponse(response(), { ...expected, applicationId: '' }));
});

test('approved requires full amount and a single matching transaction', () => {
  const order = { ...response(), status: 'processed', status_detail: 'accredited' };
  assert.throws(() => normalizeOrdersResponse(order, expected), /NOT_FULLY_PAID/);
  order.total_paid_amount = '9.99';
  assert.equal(normalizeOrdersResponse(order, expected).status, 'approved');
  order.transactions.payments[0].amount = '1.00';
  assert.throws(() => normalizeOrdersResponse(order, expected), /PAYMENT_AMOUNT/);
  order.transactions.payments = [];
  assert.throws(() => normalizeOrdersResponse(order, expected), /NOT_FULLY_PAID/);
  order.transactions.payments = [response().transactions.payments[0], response().transactions.payments[0]];
  assert.throws(() => normalizeOrdersResponse(order, expected), /MULTIPLE_PAYMENTS/);
});

test('asynchronous creation may have no payment data and is not approved', () => {
  const order = { ...response(), status: 'processing', transactions: { payments: [] } };
  const result = normalizeOrdersResponse(order, expected);
  assert.equal(result.status, 'in_process');
  assert.equal(result.pixCode, null);
});

test('boleto data uses documented fields and rejects untrusted links', () => {
  const order = response();
  const payment = order.transactions.payments[0];
  for (const [url, allowed] of [
    ['https://www.mercadopago.com.br/payments/ticket', true],
    ['https://mercadopago.com.br.evil.example/ticket', false],
    ['https://evil.example/ticket', false], ['javascript:alert(1)', false],
    ['https://user:password@www.mercadopago.com.br/ticket', false],
    ['http://www.mercadopago.com.br/ticket', false],
  ] as const) {
    const result = normalizeOrdersResponse({ ...order, transactions: { payments: [{ ...payment,
      payment_method: { id: 'boleto', type: 'ticket', digitable_line: '12345', ticket_url: url },
    }] } }, expected);
    assert.equal(Boolean(result.boletoUrl), allowed);
    assert.equal(result.boletoCode, '12345');
    assert.equal(result.pixCode, null);
  }
});

test('partial refund and authentication challenge remain explicit', () => {
  const order = response();
  assert.equal(normalizeOrdersResponse({ ...order, status: 'processed', status_detail: 'partially_refunded', total_paid_amount: '9.99' }, expected).partiallyRefunded, true);
  const challenged = { ...order, transactions: { payments: [{ amount: '9.99', payment_method: {
    id: 'visa', type: 'credit_card', transaction_security: { status: 'pending' },
  } }] } };
  const result = normalizeOrdersResponse(challenged, expected);
  assert.equal(result.requiresAuthentication, true);
  assert.equal(result.status, 'pending');
});
