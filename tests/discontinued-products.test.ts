import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { discontinuedProductCodes, isRetiredProduct } from '../lib/catalog-availability.ts';
import { sanitizeCartItems } from '../store/useCartStore.ts';
import { getPublicProductContent } from '../lib/product-public-content.ts';

test('exact ten requested products blocked, retained conditioner and capsule Xbooster allowed', () => {
  assert.equal(discontinuedProductCodes.length, 10);
  assert.equal(new Set(discontinuedProductCodes).size, 10);
  for (const code of discontinuedProductCodes) {
    assert.ok(isRetiredProduct({ code }));
    assert.equal(getPublicProductContent(code), undefined);
  }
  for (const code of ['CAP-CO-MEL', 'NUT-XBOOST', 'NUT-BORYS']) {
    assert.equal(isRetiredProduct({ code }), false);
    assert.ok(getPublicProductContent(code));
  }
});

test('saved interest lists discard discontinued products but preserve active items', () => {
  const codes = [...discontinuedProductCodes, 'CAP-CO-MEL', 'NUT-XBOOST'];
  const items = codes.map(code => ({ id: code, code, name: code, price: 10, estoque: 20, quantity: 2 }));
  assert.deepEqual(sanitizeCartItems(items).map(p => p.code), ['CAP-CO-MEL', 'NUT-XBOOST']);
});

test('document remains intact and explicit exception maps to exact code and EAN', () => {
  const doc = JSON.parse(readFileSync('docs/product-document-source.json', 'utf8'));
  assert.equal(doc.records.length, 119);
  const mel = doc.records.find((p: { code: string }) => p.code === '40551');
  assert.equal(mel.ean, '7898996428266');
  assert.match(mel.body, /Vitaminas A, D e E/);
  assert.match(mel.body, /Geleia Real/);
});
