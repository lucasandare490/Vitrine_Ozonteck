import test from 'node:test';
import assert from 'node:assert/strict';
import { applyComplementaryContent, complementaryCodes } from '../lib/product-content-complementary.ts';
import { productResearch, getProductDescription } from '../lib/product-research.ts';
import { retiredProductCodes } from '../lib/catalog-availability.ts';

test('thirteen missing summaries are filled and attributed without commercial mutations', () => {
  assert.equal(complementaryCodes.length, 13);
  assert.equal(new Set(complementaryCodes).size, 13);
  for (const code of complementaryCodes) {
    const item = productResearch[code];
    assert.ok(item.summary && item.summary.length > 100, code);
    assert.equal(item.level, 'complementary');
    assert.equal(getProductDescription(code, '.'), item.summary);
    assert.ok(item.sources.some(source => source.label.includes('revenda')));
    assert.ok(item.missing.length > 0);
    assert.equal(retiredProductCodes.some(retired => retired === code), code.startsWith('NUT-AMYNO-'));
    for (const field of ['price', 'estoque', 'name', 'image_url', 'is_deleted']) assert.equal(field in item, false);
  }
});

test('enrichment is idempotent and does not replace an existing summary', () => {
  const records = structuredClone(productResearch);
  const before = structuredClone(records);
  applyComplementaryContent(records);
  assert.deepEqual(records, before);
  records['PERF-AALI'].summary = 'Descrição aprovada do fabricante';
  applyComplementaryContent(records);
  assert.equal(records['PERF-AALI'].summary, 'Descrição aprovada do fabricante');
});

test('Amyno unit does not inherit box formula, dosage or therapeutic claims', () => {
  const summary = productResearch['NUT-AMYNO-UN'].summary!;
  assert.doesNotMatch(summary, /maltodextrina|\d+\s*(g|ml)|cura|recuperação muscular/i);
  assert.match(productResearch['NUT-AMYNO-UN'].note!, /não foram transferidas/);
});
