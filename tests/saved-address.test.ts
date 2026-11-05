import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSavedAddress } from '../lib/saved-address.ts';
const address = { cep: '50050-015', rua: 'Rua da União', numero: '295', complemento: '', bairro: 'Boa Vista', cidade: 'Recife', estado: 'PE' };
test('saved addresses require complete delivery data and a Brazilian state', () => {
  assert.equal(validateSavedAddress(address), null);
  assert.ok(validateSavedAddress({ ...address, cep: '123' }));
  assert.ok(validateSavedAddress({ ...address, estado: 'ZZ' }));
  assert.ok(validateSavedAddress({ ...address, cidade: ' ' }));
  assert.ok(validateSavedAddress({ ...address, numero: '' }));
  assert.equal(validateSavedAddress({ ...address, numero: 'S/N' }), null);
});
