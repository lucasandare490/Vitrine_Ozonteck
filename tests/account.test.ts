import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrderStatus } from '../lib/order-status.ts';
import { requiresSecondFactor } from '../lib/mfa-policy.ts';

test('pending, declined and review orders never imply payment or shipment', () => {
  for (const status of ['pending', 'pagamento_recusado', 'revisao_pagamento', 'revisao_estoque', 'cancelado']) {
    assert.equal(getOrderStatus(status).paid, false);
    assert.equal(getOrderStatus(status).stage, 0);
  }
  assert.equal(getOrderStatus('preparando').stage, 1);
  assert.equal(getOrderStatus('enviado').stage, 2);
  assert.equal(getOrderStatus('entregue').stage, 3);
});

test('MFA is optional until verified, mandatory for all authenticated token types thereafter', () => {
  assert.equal(requiresSecondFactor(undefined, 'aal1'), false);
  assert.equal(requiresSecondFactor([{ status: 'unverified' }], 'aal1'), false);
  for (const aal of [undefined, null, '', 'aal1']) {
    assert.equal(requiresSecondFactor([{ status: 'verified' }], aal), true);
  }
  assert.equal(requiresSecondFactor([{ status: 'verified' }], 'aal2'), false);
});
