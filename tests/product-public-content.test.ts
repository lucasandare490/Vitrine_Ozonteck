import test from 'node:test';
import assert from 'node:assert/strict';
import { productResearch } from '../lib/product-research.ts';
import { retiredProductCodes } from '../lib/catalog-availability.ts';
import { getPublicProductContent, getPublicProductDescription, getPublicProductSpecifications } from '../lib/product-public-content.ts';

test('all 109 active catalog entries have clean public content without mutating research', () => {
  const before = JSON.stringify(productResearch);
  const active = Object.keys(productResearch).filter(code => !retiredProductCodes.some(retired => retired === code));
  assert.equal(active.length, 109);
  for (const code of active) {
    const content = getPublicProductContent(code);
    assert.ok(content, code);
    assert.ok(content?.summary?.trim(), code);
    assert.deepEqual(Object.keys(content).sort(), ['line', 'sections', 'summary']);
    const specs = getPublicProductSpecifications({ code, category: code.startsWith('NUT-') ? 'Nutracêuticos' : /^(PERF|P100)-/.test(code) ? 'Perfumaria' : 'Cuidados Capilares' });
    const publicText = [content.summary, ...content.sections!.flatMap(s => s.items), ...specs.map(s => s.value)].join(' ');
    assert.doesNotMatch(publicText, /não informado|a confirmar|conforme (?:a )?(?:descrição|material)|revenda|lista publicada|fonte consultada|confira o rótulo|confirmar no rótulo|consulte a embalagem/i, code);
    assert.equal(new Set(content.sections!.map(s => s.title)).size, content.sections!.length, code);
    for (const section of content.sections!) assert.ok(section.items.length && section.items.every(item => item.trim()), code);
  }
  assert.equal(JSON.stringify(productResearch), before);
});

test('retired products remain excluded and new admin descriptions remain supported', () => {
  for (const code of retiredProductCodes) {
    assert.equal(getPublicProductContent(code), undefined);
    assert.equal(getPublicProductDescription(code, 'old description'), undefined);
  }
  assert.equal(getPublicProductDescription('NEW-ADMIN', '  Descrição cadastrada.  '), 'Descrição cadastrada.');
  assert.equal(getPublicProductDescription('NEW-ADMIN', '  '), undefined);
});

test('actual precautions survive and disputed facts are not republished', () => {
  assert.match(JSON.stringify(getPublicProductContent('BE-SHII')), /gravidez.*7 anos/);
  assert.match(JSON.stringify(getPublicProductContent('BE-FRESH')), /6 anos/);
  assert.match(JSON.stringify(getPublicProductContent('CAP-MAS-MC')), /argan e proteínas hidrolisadas/i);
  assert.match(JSON.stringify(getPublicProductContent('CAP-MAS-MC')), /20 a 30 minutos/);
  assert.doesNotMatch(JSON.stringify(getPublicProductContent('BE-HAY')), /ureia|urea/i);
  for (const code of ['PERF-303-M', 'PERF-303-VIP', 'PERF-SENTIMENTO', 'P100-SENT']) {
    assert.ok(!getPublicProductContent(code)?.sections?.some(s => /^Notas de/.test(s.title)), code);
  }
});

test('supplied vitamins, ingredients, preparation and detailed features remain public', () => {
  const required: Record<string, RegExp[]> = {
    'CAP-SH-BL': [/vitaminas A e C/i, /queratina/i],
    'CAP-MAS-BL': [/vitaminas A e C/i, /penteabilidade/i],
    'CAP-KIDS-SH': [/vitaminas A, B e C/i, /surfactantes/i],
    'CAP-KIDS-CO': [/vitaminas A, B e C/i, /oftalmologicamente/i],
    'CAP-KIDS-LE': [/vitaminas A, B e C/i, /desembara/i],
    'CAP-FOR-MEN': [/B7/, /3, 6, 7 e 9/],
    'CAP-O-CREAM': [/cutículas/, /elasticidade/, /pontas duplas/],
    'CAP-O-ACAI': [/adicionado a máscaras/, /duas a três vezes/],
    'CAP-MAS-OK': [/20 a 40 minutos/, /cupuaçu/, /queratina/],
    'NUT-LEV-UN': [/água gelada ou quente/, /Polidextrose/],
    'CAP-CO-MEL': [/vitaminas A, D e E/i, /geleia real/i, /3 minutos/],
    'NUT-FLEX-CX': [/vitaminas C, D, E e K2/i],
    'BE-OX3': [/Vitaminas A, B, C e E/, /bardana/],
  };
  for (const [code, patterns] of Object.entries(required)) {
    const text = JSON.stringify(getPublicProductContent(code));
    for (const pattern of patterns) assert.match(text, pattern, code);
  }
});
