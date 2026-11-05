import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProductImport, previewProductImport } from '../lib/product-import.ts';

const products = [
  { code: '001', name: 'Óleo', category: 'Bem Estar', price: 15, estoque: 7, is_deleted: false },
  { code: 'CAP-A', name: 'Shampoo', category: null, price: 30, estoque: 2, is_deleted: false },
];
const categories = [{ name: 'Bem Estar', archived_at: null }];

test('semicolon import supports Portuguese aliases, BOM, CRLF and decimal commas without losing code zeros', () => {
  assert.deepEqual(parseProductImport('\uFEFFCódigo;Preço;Estoque\r\n001;12,90;0\r\n'), [{ code: '001', price: 12.9, estoque: 0 }]);
  assert.deepEqual(parseProductImport('SKU;Valor;Quantidade\nCAP-A;1.234,56;8'), [{ code: 'CAP-A', price: 1234.56, estoque: 8 }]);
});

test('tab import handles quoted delimiters, escaped quotes and trailing empty lines', () => {
  assert.deepEqual(parseProductImport('code\tprice\testoque\n"A;""B"\t"12.50"\t3\n\n'), [{ code: 'A;"B', price: 12.5, estoque: 3 }]);
  assert.deepEqual(parseProductImport('"código";"preço"\n"A;B";"19,99"'), [{ code: 'A;B', price: 19.99 }]);
});

test('blank or absent update fields are omitted, never replaced with defaults', () => {
  assert.deepEqual(parseProductImport('Código;Preço;Estoque\n001;;0\nCAP-A;20,00;'), [{ code: '001', estoque: 0 }, { code: 'CAP-A', price: 20 }]);
  assert.deepEqual(parseProductImport('código\testoque\n001\t4'), [{ code: '001', estoque: 4 }]);
});

test('invalid headers, duplicate aliases and editable content columns are rejected', () => {
  for (const text of ['codigo;preco;price\n001;1;2', 'preco;estoque\n1;2', 'codigo\n001',
    'codigo;nome;preco\n001;Inventado;10', 'codigo;categoria;estoque\n001;Nova;1',
    'codigo;image_url;estoque\n001;https://example.test/a.png;1', 'codigo,preco,estoque\n001,10,1']) {
    assert.throws(() => parseProductImport(text), Error, text);
  }
});

test('malformed CSV is rejected rather than silently shifting fields', () => {
  for (const text of ['code;price\n"001;10', 'code;price\n0"01;10', 'code;price\n"001"oops;10',
    'code;price\n001;10;3', 'code;price\n001', 'code;price\n"00\n1";10']) {
    assert.throws(() => parseProductImport(text), Error, text);
  }
});

test('price and stock reject partial parsing, negative, fractional stock, nonfinite and overflow values', () => {
  for (const value of ['0', '-1', 'NaN', 'Infinity', '10abc', '1e2', '1,234', '1000000', '1.2.3']) {
    assert.throws(() => parseProductImport(`codigo;preco\n001;${value}`), Error, value);
  }
  for (const value of ['-1', '1.5', '1,5', '10abc', '2147483648', 'NaN']) {
    assert.throws(() => parseProductImport(`codigo;estoque\n001;${value}`), Error, value);
  }
});

test('empty imports, duplicate exact codes, oversized codes/files and batches above 100 are blocked', () => {
  for (const text of ['', 'code;price\n', 'code;price\n001;\n', 'code;price\n001;1\n001;2',
    `code;price\n${'A'.repeat(101)};1`, ' '.repeat(131073)]) {
    assert.throws(() => parseProductImport(text), Error);
  }
  const rows = Array.from({ length: 100 }, (_, i) => `P${i};1`).join('\n');
  assert.equal(parseProductImport(`code;price\n${rows}`).length, 100);
  assert.throws(() => parseProductImport(`code;price\n${rows}\nP100;2`));
});

test('preview uses existing names and builds only field-specific updates and concurrency expectations', () => {
  const preview = previewProductImport([{ code: '001', price: 20 }, { code: 'CAP-A', estoque: 0 }], products, categories);
  assert.deepEqual(preview.payload, [{ code: '001', price: 20 }, { code: 'CAP-A', estoque: 0 }]);
  assert.deepEqual(preview.expected, [{ code: '001', price: 15 }, { code: 'CAP-A', estoque: 2 }]);
  assert.deepEqual(preview.rows[0], { code: '001', name: 'Óleo', category: 'Bem Estar', before: { price: 15, estoque: 7 }, after: { price: 20, estoque: 7 } });
  assert.equal(products[0].price, 15, 'Preview never mutates the loaded catalog');
});

test('preview blocks missing/archived products, invalid existing names and nonexistent/archived categories', () => {
  assert.throws(() => previewProductImport([{ code: 'NEW', price: 1 }], products, categories));
  for (const product of [{ ...products[0], is_deleted: true }, { ...products[0], name: ' ' },
    { ...products[0], category: 'Inexistente' }]) {
    assert.throws(() => previewProductImport([{ code: '001', price: 1 }], [product], categories));
  }
  assert.throws(() => previewProductImport([{ code: '001', price: 1 }], products, [{ name: 'Bem Estar', archived_at: '2026-01-01' }]));
});
