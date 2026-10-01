import assert from 'node:assert/strict';
import test from 'node:test';
import { getPasswordValidationError, isValidCpf } from '../lib/auth.ts';

test('aceita senha com oito ou mais caracteres', () => {
  assert.equal(getPasswordValidationError('senha-123'), null);
});

test('rejeita senha curta', () => {
  assert.match(getPasswordValidationError('1234567') ?? '', /8 caracteres/);
});

test('valida CPF pelo digito verificador', () => {
  assert.equal(isValidCpf('529.982.247-25'), true);
  assert.equal(isValidCpf('52998224724'), false);
  assert.equal(isValidCpf('111.111.111-11'), false);
});
