import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeCartItems } from '../store/useCartStore.ts';

test('preserva quantidades validas ao restaurar o carrinho', () => {
  const items = sanitizeCartItems([{
    id: 'produto-1',
    code: 'OZK-1',
    name: 'Produto',
    price: 19.9,
    quantity: 3,
    estoque: 5,
  }]);

  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 3);
});

test('limita quantidade ao estoque disponivel', () => {
  const [item] = sanitizeCartItems([{
    id: 'produto-1',
    code: 'OZK-1',
    name: 'Produto',
    price: 19.9,
    quantity: 8,
    estoque: 2,
  }]);

  assert.equal(item.quantity, 2);
});

test('descarta itens adulterados', () => {
  const items = sanitizeCartItems([
    { id: 'sem-campos' },
    {
      id: 'produto-1',
      code: 'OZK-1',
      name: 'Produto',
      price: -1,
      quantity: 1,
      estoque: 2,
    },
  ]);

  assert.deepEqual(items, []);
});
