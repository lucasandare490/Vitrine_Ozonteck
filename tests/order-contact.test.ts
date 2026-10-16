import assert from 'node:assert/strict';
import test from 'node:test';
import { orderContactLink, orderAddressText } from '../lib/order-contact.ts';

test('contato usa telefone do pedido, normaliza DDI e inclui identificador', () => {
  const link = new URL(orderContactLink('pedido-123', { nome: 'Ana', telefone: '(81) 99999-9999' })!);
  assert.equal(link.pathname, '/5581999999999');
  assert.match(link.searchParams.get('text')!, /pedido-123/);
  assert.equal(new URL(orderContactLink('1', { telefone: '+55 81 99999-9999' })!).pathname, link.pathname);
});
test('telefone ausente ou inválido não produz link', () => {
  assert.equal(orderContactLink('1', null), null);
  assert.equal(orderContactLink('1', { telefone: 'abc' }), null);
});
test('mensagem não declara pagamento aprovado e distingue retirada', () => {
  const text = new URL(orderContactLink('1', { telefone: '81999999999', modalidade: 'retirada' })!).searchParams.get('text')!;
  assert.match(text, /retirada na loja/);
  assert.doesNotMatch(text, /aprovado|pago/);
});
test('endereço mantém número e complemento', () => {
  assert.equal(orderAddressText({ rua: 'Rua A', numero: '10', complemento: 'Apto 3' }), 'Rua A, 10, Apto 3');
});
