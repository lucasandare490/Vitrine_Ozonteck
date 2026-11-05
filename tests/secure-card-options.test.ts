import assert from 'node:assert/strict';
import test from 'node:test';
import { cardMethods, cardInstallments } from '../lib/secure-card-options.ts';

test('only active credit and debit methods are selectable', () => {
  const methods = cardMethods({ results: [
    { id: 'visa', name: 'Visa', payment_type_id: 'credit_card', status: 'active' },
    { id: 'visa', name: 'Visa', payment_type_id: 'debit_card', status: 'active' },
    { id: 'pix', payment_type_id: 'bank_transfer', status: 'active' },
    { id: 'master', payment_type_id: 'credit_card', status: 'inactive' },
  ] });
  assert.equal(methods.length, 2);
  assert.notEqual(methods[0].key, methods[1].key);
});

test('installments use the selected card type, provider limits and issuer', () => {
  const response = [{ payment_method_id: 'visa', payment_type_id: 'credit_card', issuer: { id: 1 }, payer_costs: [
    { installments: 1, recommended_message: '1x de R$ 10,00', total_amount: 10 },
    { installments: 13, recommended_message: '13x', total_amount: 15 },
  ] }, { payment_method_id: 'master', payment_type_id: 'credit_card', issuer: { id: 2 }, payer_costs: [{ installments: 2, recommended_message: '2x', total_amount: 10 }] }];
  assert.deepEqual(cardInstallments(response, { id: 'visa', type: 'credit_card' }), [{ installments: 1, label: '1x de R$ 10,00', issuer: '1' }]);
  assert.deepEqual(cardInstallments(response, { id: 'visa', type: 'debit_card' }), []);
});
