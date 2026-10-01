import assert from 'node:assert/strict';
import test from 'node:test';
import { productResearch, getProductDescription } from '../lib/product-research.ts';
import { suppliedProductCodes } from '../lib/product-content-reviewed.ts';
import { isRetiredProduct, retiredAccessoryCodes } from '../lib/catalog-availability.ts';
import { sanitizeCartItems, useCartStore } from '../store/useCartStore.ts';

test('cada referencia recebida possui conteudo especifico e preserva fontes', () => {
  assert.equal(new Set(suppliedProductCodes).size, suppliedProductCodes.length);
  for (const code of suppliedProductCodes) {
    const research = productResearch[code];
    assert.ok(research?.editorialReviewed, code);
    assert.ok(research.summary && research.summary.length > 70, code);
    assert.ok(research.sources.length > 0, code);
    assert.ok(research.sections?.length, code);
    assert.equal(new Set(research.sections.map(section => section.title)).size, research.sections.length, code);
    assert.ok(research.sections.every(section => section.items.length > 0), code);
  }
});

test('revisao substitui resumo antigo apenas nos codigos revisados', () => {
  assert.equal(getProductDescription('BE-SOFH', 'Texto antigo'), productResearch['BE-SOFH'].summary);
  assert.equal(getProductDescription('NUT-COBAL', 'Texto do cadastro'), 'Texto do cadastro');
});

test('perfumaria separa volumes, notas completas e hidratante homonimo', () => {
  for (const code of suppliedProductCodes.filter(code => /^(PERF-|P100-)/.test(code))) {
    for (const title of ['Notas de saída', 'Notas de coração', 'Notas de fundo']) {
      assert.ok(productResearch[code].sections?.find(section => section.title === title), `${code}: ${title}`);
    }
  }
  assert.notEqual(productResearch['PERF-VG'], productResearch['P100-VG']);
  assert.doesNotMatch(JSON.stringify(productResearch['BE-HID-VG'].sections), /champanhe rosé/);
  assert.match(JSON.stringify(productResearch['BE-HID-VG'].sections), /apresentação distinta/);
  assert.match(JSON.stringify(productResearch['PERF-VG'].sections), /Algodão-doce/);
  assert.match(JSON.stringify(productResearch['PERF-CIND'].sections), /Pralinê|pralinê/);
});

test('preserva rotulos e evita trocar flex por amyno ou capsulas por energetico', () => {
  assert.match(productResearch['NUT-FLEX-CX'].summary || '', /colágeno tipo II/);
  assert.doesNotMatch(productResearch['NUT-FLEX-CX'].summary || '', /aminoácidos/i);
  assert.match(productResearch['NUT-XBOOST'].summary || '', /cápsulas/);
  assert.match(JSON.stringify(productResearch['NUT-TRIMAG'].sections), /dimagnésio malato/);
  assert.match(JSON.stringify(productResearch['CAP-O-CREAM'].sections), /baobá/);
  assert.doesNotMatch(JSON.stringify(productResearch['CAP-O-CREAM'].sections), /não enumera os 20/);
});

test('acessorios retirados nao voltam pelo carrinho persistido ou adicao', () => {
  const item = { id: 'test', code: 'AC-CXMEM', name: 'Caixa', price: 50, estoque: 10, quantity: 1 };
  for (const code of retiredAccessoryCodes) assert.equal(isRetiredProduct({ code }), true);
  assert.equal(isRetiredProduct({ code: 'NEW-ACC', category: 'Acessórios' }), true);
  assert.equal(isRetiredProduct({ code: 'BE-SOFH', category: 'Bem Estar' }), false);
  assert.deepEqual(sanitizeCartItems([item]), []);
  useCartStore.setState({ items: [] });
  useCartStore.getState().addItem(item);
  assert.deepEqual(useCartStore.getState().items, []);
});

test('toque luminoso e energetico retirados sem afetar Xbooster em capsulas', () => {
  const item = { id: 'retired', code: 'BE-TOQUE-LUM', name: 'Toque Luminoso', price: 565.6, estoque: 9999, quantity: 1 };
  for (const code of ['BE-TOQUE-LUM', 'BE-XBOOST-269']) {
    assert.equal(isRetiredProduct({ code, category: 'Bem Estar' }), true);
    assert.deepEqual(sanitizeCartItems([{ ...item, code }]), []);
    useCartStore.setState({ items: [] });
    useCartStore.getState().addItem({ ...item, code });
    assert.deepEqual(useCartStore.getState().items, []);
  }
  assert.equal(isRetiredProduct({ code: 'NUT-XBOOST', category: 'Nutracêuticos' }), false);
  assert.equal(isRetiredProduct({ code: 'BE-SER-LUM', category: 'Bem Estar' }), true);
  assert.equal(isRetiredProduct({ code: 'CAP-CO-MEL', category: 'Cuidados Capilares' }), false);
});
