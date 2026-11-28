import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogReturn, mobileDestinations, mobileSection, mobileTitles, isMobileDestinationActive } from '../lib/mobile-navigation.ts';

test('mobile: primary destinations cover browse, search, favorites, cart and account without duplicate active tabs', () => {
  assert.equal(mobileDestinations.length, 5);
  for (const path of ['/', '/produto/QA', '/busca', '/conta/favoritos', '/lista', '/conta', '/login', '/conta/pedidos']) {
    assert.equal(mobileDestinations.filter(destination => isMobileDestinationActive(path, destination.href)).length, 1, path);
  }
});
test('mobile: private/admin/product contexts remain distinct and known pages have titles', () => {
  assert.equal(mobileSection('/admin/clientes'), 'admin'); assert.equal(mobileSection('/produto/QA'), 'product');
  assert.equal(mobileSection('/lista'), 'checkout'); assert.equal(mobileSection('/conta/dados'), 'account');
  for (const path of ['/busca', '/login', '/conta/favoritos', '/conta/enderecos', '/suporte', '/instalar']) assert.ok(mobileTitles[path]);
});
test('mobile: return context preserves catalog filters but rejects external and private destinations', () => {
  assert.equal(catalogReturn('/?q=óleo&categoria=Perfumaria&ordem=price-asc'), '/?q=%C3%B3leo&categoria=Perfumaria&ordem=price-asc#catalogo');
  for (const value of [null, '//evil.invalid', 'https://evil.invalid/', '/admin', '/conta', 'javascript:alert(1)']) assert.equal(catalogReturn(value), '/#catalogo');
});
