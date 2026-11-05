import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldDeliverOrderEmail, emailRetry } from '../lib/customer-email-delivery.ts';

test('never sends pending or rejected mail after approval, nor approval for payment review', () => {
  const order = { user_id: 'owner', status: 'preparando', status_pagamento: 'approved' };
  assert.equal(shouldDeliverOrderEmail('payment_pending', order), false);
  assert.equal(shouldDeliverOrderEmail('payment_rejected', order), false);
  assert.equal(shouldDeliverOrderEmail('payment_approved', order), true);
  assert.equal(shouldDeliverOrderEmail('payment_approved', { ...order, status: 'revisao_pagamento' }), false);
});
test('refund and delivery messages require matching confirmed states', () => {
  const order = { user_id: 'owner', status: 'reembolsado', status_pagamento: 'pending' };
  assert.equal(shouldDeliverOrderEmail('refund_confirmed', order), false);
  assert.equal(shouldDeliverOrderEmail('refund_confirmed', { ...order, status_pagamento: 'refunded' }), true);
  assert.equal(shouldDeliverOrderEmail('order_delivered', order), false);
  assert.equal(shouldDeliverOrderEmail('pickup_ready', order), false);
});
test('retries back off and stop at the fifth attempt', () => {
  assert.equal(emailRetry(1, 0).available_at, '1970-01-01T00:05:00.000Z');
  assert.equal(emailRetry(2, 0).available_at, '1970-01-01T00:10:00.000Z');
  assert.equal(emailRetry(5, 0).state, 'failed');
});

test('pickup notice requires explicit readiness, approval and pickup mode', () => {
  const order = { user_id: 'owner', status: 'preparando', status_pagamento: 'approved', retirada_pronta_em: '2026-11-04T12:00:00Z', endereco_entrega: { modalidade: 'retirada' } };
  assert.equal(shouldDeliverOrderEmail('pickup_ready', order), true);
  assert.equal(shouldDeliverOrderEmail('pickup_ready', { ...order, retirada_pronta_em: null }), false);
  assert.equal(shouldDeliverOrderEmail('pickup_ready', { ...order, status_pagamento: 'refunded' }), false);
  assert.equal(shouldDeliverOrderEmail('pickup_ready', { ...order, status: 'entregue' }), false);
  assert.equal(shouldDeliverOrderEmail('pickup_ready', { ...order, endereco_entrega: { modalidade: 'entrega' } }), false);
});
