import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registrationProducts } from '../lib/product-registration.ts';
import { productOfficialCodes, isValidEan13 } from '../lib/product-official-codes.ts';
import { productResearch } from '../lib/product-research.ts';
import { getProductSpecifications } from '../lib/product-specs.ts';

const source = JSON.parse(readFileSync(new URL('../docs/product-revision-2-source.json', import.meta.url), 'utf8'));
const previous = JSON.parse(readFileSync(new URL('../docs/product-revision-2-audit.json', import.meta.url), 'utf8'));
test('registration contains eleven distinct absent identities and no VG, lotions or accessories', () => {
  assert.equal(registrationProducts.length, 11);
  assert.equal(new Set(registrationProducts.map(p => p.code)).size, 11);
  for (const p of registrationProducts) {
    assert.ok(!previous.products.some((old: {code: string}) => old.code === p.code));
    assert.doesNotMatch(p.name, /VG|Speed Black|Loção/i);
    assert.doesNotMatch(p.code, /^(AC|PERF|P100)-/);
    assert.equal(productOfficialCodes[p.code].codigoOriginal, p.codigoOriginal);
    if (p.ean) assert.ok(isValidEan13(p.ean), p.code);
    const block = source.blocks.find((b: {position: number}) => b.position === p.sourcePosition);
    if (p.sourcePosition) {
      assert.equal(block.codigoOriginal, p.codigoOriginal);
      assert.equal(block.ean, p.ean);
    }
    const specs = getProductSpecifications(p, productResearch[p.code]);
    assert.ok(specs.some(s => s.value === p.codigoOriginal));
    assert.equal(specs.some(s => s.label === 'Código EAN'), Boolean(p.ean));
    assert.equal(new Set(specs.map(s => s.label)).size, specs.length);
    assert.match(p.image, /^[a-z0-9]+\.webp$/);
  }
});
test('placeholders do not acquire descriptions, usage and safety notes remain separate', () => {
  for (const code of ['BE-TOQUE-LUM','BE-XBOOST-269']) {
    assert.equal(productResearch[code].summary, undefined);
    assert.equal(productResearch[code].level, 'pending');
  }
  const pro = productResearch['CAP-PRO-KES'];
  assert.match(JSON.stringify(pro.sections), /luvas|gravidez|teste de mecha/);
  assert.ok(!pro.sections?.some(s => s.title === 'Modo de uso'));
  assert.doesNotMatch(JSON.stringify(registrationProducts), /240\/18|emagrecimento|proteção contra infecções/);
});
test('generated SQL has every approved price and image without changing existing products', () => {
  const sql = readFileSync(new URL('../supabase/manual/20260929_cadastrar_11_produtos.sql', import.meta.url), 'utf8');
  for (const p of registrationProducts) {
    assert.ok(sql.includes(`'${p.code}'`));
    assert.ok(sql.includes(`/produtos/${p.image}`));
    assert.ok(sql.includes(p.price.toFixed(2)));
  }
  assert.match(sql, /on conflict\(code\) do nothing/);
  assert.doesNotMatch(sql, /update public\.produtos|delete from|BE-HID-VG|PERF-VG|P100-VG/i);
});
