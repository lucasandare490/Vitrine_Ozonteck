import test from 'node:test';
import assert from 'node:assert/strict';
import { customerActivity, customerContactMessage } from '../lib/customer-activity.ts';

test('activity ignores unpaid, cancelled, invalid and future purchases', () => {
  const base = { user_id: 'a', created_at: '2026-09-01T12:00:00Z', status: 'entregue', status_pagamento: 'approved', valor_total: 9.99 };
  const activity = customerActivity([base, { ...base, status: 'aguardando_pagamento' }, { ...base, status: 'cancelado' }, { ...base, created_at: 'invalid' }, { ...base, created_at: '2027-01-01' }, { ...base, user_id: null }], new Date('2026-11-03T12:00:00Z'));
  assert.deepEqual(activity.get('a'), { orders: 1, total: 9.99, lastPurchase: base.created_at, daysSincePurchase: 63 });
});

test('last purchase does not depend on order and customers stay separate', () => {
  const base = { user_id: 'a', created_at: '2026-10-30T12:00:00Z', status: 'preparando', status_pagamento: 'approved', valor_total: 0.1 };
  const activity = customerActivity([base, { ...base, created_at: '2026-09-01', valor_total: 0.2 }, { ...base, user_id: 'b' }], new Date('2026-11-03T12:00:00Z'));
  assert.equal(activity.get('a')?.total, 0.3);
  assert.equal(activity.get('a')?.orders, 2);
  assert.equal(activity.get('a')?.daysSincePurchase, 4);
  assert.equal(activity.size, 2);
  assert.match(customerContactMessage('Ana Silva'), /Olá, Ana!/);
  assert.match(customerContactMessage(null), /^Olá!/);
});

test('contact drafts offer distinct purposes without inventing debts, benefits or customer dates', () => {
  const drafts = ['contact', 'reorder', 'reactivation'].map(purpose => customerContactMessage(' Ana Silva ', purpose));
  assert.equal(new Set(drafts).size, 3);
  assert.match(drafts[1], /próxima compra/);
  assert.match(drafts[2], /precisa de alguma ajuda/);
  for (const draft of drafts) {
    assert.match(draft, /^Olá, Ana!/);
    assert.match(draft, /https:\/\/ozonteck-recife\.netlify\.app\//);
    assert.match(draft, /preferir não receber/);
    assert.doesNotMatch(draft, /aniversário|dívida|desconto|cura|último contato/i);
  }
  assert.equal(customerContactMessage(null, 'unknown'), customerContactMessage(null));
});
