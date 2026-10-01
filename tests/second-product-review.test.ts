import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { productOfficialCodes, isValidEan13 } from '../lib/product-official-codes.ts';
import { productResearch, getProductDescription } from '../lib/product-research.ts';
import { getProductSpecifications, structuredSectionTitles } from '../lib/product-specs.ts';
import { perfumePairs } from '../lib/product-content-second-review.ts';
import { complementaryCodes } from '../lib/product-content-complementary.ts';

const previous = JSON.parse(readFileSync(new URL('../docs/product-revision-2-before.json', import.meta.url), 'utf8'));
const input = JSON.parse(readFileSync(new URL('../docs/product-revision-2-source.json', import.meta.url), 'utf8'));
const previousIdentities = Object.fromEntries(Object.entries(productOfficialCodes).filter(([code]) => code in previous));

test('all 119 input records are accounted for and 108 identities match exact strings', () => {
  assert.equal(input.blocks.length, 119);
  assert.equal(Object.keys(previousIdentities).length, 108);
  assert.equal(new Set(Object.values(previousIdentities).map(ids => ids.ean)).size, 108);
  assert.equal(new Set(Object.values(previousIdentities).map(ids => ids.codigoOriginal)).size, 108);
  for (const [code, ids] of Object.entries(previousIdentities)) {
    assert.ok(productResearch[code], code);
    assert.ok(input.blocks.some((block: { codigoOriginal: string; ean: string }) => block.codigoOriginal === ids.codigoOriginal && block.ean === ids.ean), code);
    assert.equal(isValidEan13(ids.ean), true, code);
  }
  assert.equal(productOfficialCodes['P100-PRES'].codigoOriginal, '40720 -B');
  assert.equal(productOfficialCodes['P100-MADAME'].codigoOriginal, '40714 - B');
  assert.equal(productOfficialCodes['BE-HID-SB'].codigoOriginal, '44988');
  assert.equal(productOfficialCodes['BE-HID-VG'].codigoOriginal, '40564');
});

test('EAN validation rejects malformed values and preserves leading zeroes', () => {
  for (const value of ['', '.', '7898760210454', '78987602104550', '789876021045', '789876021045X']) assert.equal(isValidEan13(value), false);
  assert.equal(isValidEan13('0123456789012'), true);
});

test('all fourteen perfume pairs share description and non-identity specifications', () => {
  for (const [small, large] of perfumePairs) {
    assert.equal(productResearch[small].summary, productResearch[large].summary, small);
    const specs = (code: string) => getProductSpecifications({ code, category: 'Perfumaria' }, productResearch[code]);
    const common = (code: string) => specs(code).filter(field => field.group !== 'identity' && field.label !== 'Apresentação');
    assert.deepEqual(common(small), common(large), small);
    assert.equal(specs(small).find(field => field.label === 'Apresentação')?.value, '17 ml');
    assert.equal(specs(large).find(field => field.label === 'Apresentação')?.value, '100 ml');
    assert.notEqual(productOfficialCodes[small].ean, productOfficialCodes[large].ean);
  }
});

test('placeholders retain every existing editorial field; no dosage or formula borrowed', () => {
  for (const block of input.blocks) {
    if (!(block.body.length < 130 && /(?:sem descrição|novidade|\.)\s*$/i.test(block.body))) continue;
    const entry = Object.entries(previousIdentities).find(([, ids]) => ids.codigoOriginal === block.codigoOriginal);
    if (entry && !complementaryCodes.includes(entry[0])) assert.deepEqual(JSON.parse(JSON.stringify(productResearch[entry[0]])), previous[entry[0]], entry[0]);
  }
  assert.match(productResearch['NUT-FLEX-CX'].summary || '', /colágeno tipo II/);
  assert.doesNotMatch(productResearch['NUT-FLEX-CX'].summary || '', /amyno/i);
});

test('all previous sources remain and specifications contain no empty values or commercial fields', () => {
  for (const [code, research] of Object.entries(productResearch)) {
    if (!(code in previous)) continue;
    for (const source of previous[code].sources) assert.ok(research.sources.some(current => current.url === source.url && current.label === source.label), code);
    const category = code.startsWith('NUT-') ? 'Nutracêuticos' : /^(PERF|P100)/.test(code) ? 'Perfumaria' : 'Cuidados Capilares';
    const specs = getProductSpecifications({ code, category }, research);
    assert.ok(specs.every(field => field.value.trim() && field.value !== '.' && !/preço|estoque/i.test(field.label)), code);
    assert.equal(new Set(specs.map(field => field.label)).size, specs.length, code);
    if (productOfficialCodes[code]) assert.equal(specs.at(-1)?.label, 'Código EAN', code);
    for (const section of research.sections || []) {
      if (structuredSectionTitles.has(section.title)) assert.ok(specs.some(field => field.value === section.items.join(' ')), `${code}: section lost ${section.title}`);
    }
  }
});

test('new formulas do not receive previous lotion ingredients in specifications', () => {
  for (const code of ['BE-HID-SB', 'BE-HID-VG']) {
    const fields = getProductSpecifications({code,category:'Bem Estar'},productResearch[code]);
    assert.equal(fields.some(field => field.label === 'Ativos destacados'), false);
    assert.equal(fields.find(field => field.label === 'Apresentação')?.value, '120 g');
  }
  for (const code of ['PERF-FER-VE', 'PERF-LUA-VE']) {
    assert.equal(getProductSpecifications({code,category:'Perfumaria'},productResearch[code]).some(field => field.label === 'Apresentação'), false);
  }
});

test('120 g lotion descriptions and rendered sections cannot reuse the former formula', () => {
  for (const code of ['BE-HID-SB', 'BE-HID-VG']) {
    const research = productResearch[code];
    // The same description feeds the visible page, metadata and Product JSON-LD.
    const description = getProductDescription(code, 'Loção anterior com ácido hialurônico e vitamina E.');
    assert.match(description || '', /120 g/);
    assert.match(description || '', /nova fórmula/);
    const currentClaims = JSON.stringify({ description, sections: research.sections, details: research.details });
    assert.doesNotMatch(currentClaims, /ácido hialurônico|vitamina E|champanhe|bergamota|adultos/i);
    assert.match(currentClaims, /apresentação distinta/);
    assert.equal(productOfficialCodes[code].codigoOriginal, code === 'BE-HID-SB' ? '44988' : '40564');
  }
});
