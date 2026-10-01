import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPrice, isTestProduct, productPath, serializeStructuredData } from '../lib/products.ts';

test('codifica referencias sem permitir mudar a rota', () => {
  assert.equal(productPath('CAP-KIDS-SH'), '/produto/CAP-KIDS-SH');
  assert.equal(productPath('A/B?x=1'), '/produto/A%2FB%3Fx%3D1');
});

test('identifica cadastros de teste sem excluir produtos comuns', () => {
  assert.equal(isTestProduct({ category: 'Teste', name: 'Produto' }), true);
  assert.equal(isTestProduct({ category: 'Outros', name: '[TESTE] Produto' }), true);
  assert.equal(isTestProduct({ category: 'Bem Estar', name: 'Óleo Sofh' }), false);
});

test('preserva precos em reais', () => {
  assert.equal(formatPrice(89.8).replace(/\s/g, ' '), 'R$ 89,80');
});

test('JSON-LD nao permite encerrar o elemento script', () => {
  const input = { name: '</script><script>alert(1)</script>' };
  const json = serializeStructuredData(input);
  assert.equal(json.includes('<'), false);
  assert.deepEqual(JSON.parse(json), input);
});
