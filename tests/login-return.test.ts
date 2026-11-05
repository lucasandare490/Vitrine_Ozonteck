import assert from 'node:assert/strict';
import test from 'node:test';
import { safeLoginReturn } from '../lib/login-return.ts';

test('returns to support and existing customer routes after login', () => {
  for (const route of ['/suporte', '/junte-se-a-nos', '/lista', '/conta/pedidos']) {
    assert.equal(safeLoginReturn(`?redirect=${encodeURIComponent(route)}`), route);
  }
});

test('rejects external, encoded, login-loop and unsupported destinations', () => {
  for (const route of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', 'javascript:alert(1)', '/login', '/admin', '/suporte?redirect=https://evil.invalid', '/suporte#x', '/conta/../login', '/%2f%2fevil.invalid']) {
    assert.equal(safeLoginReturn(`?redirect=${encodeURIComponent(route)}`), null);
  }
  assert.equal(safeLoginReturn(''), null);
});
