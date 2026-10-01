import assert from 'node:assert/strict';
import test from 'node:test';
import { createStore } from 'zustand/vanilla';
import { createCartState, type CartItem } from '../store/useCartStore.ts';
import { createCartSync } from '../lib/cart-sync.ts';

const item = (id: string): CartItem => ({ id, code: `CODE-${id}`, name: id, price: 10, quantity: 2, estoque: 10 });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
function setup(initial: Record<string, CartItem[]> = { A: [item('one'), item('two')], B: [item('other')] }) {
  const db = structuredClone(initial);
  const store = createStore(createCartState);
  const reads: string[] = [];
  const writes: { user: string; items: CartItem[] }[] = [];
  const remote = {
    async read(user: string): Promise<unknown> { reads.push(user); return structuredClone(db[user] ?? []); },
    async write(user: string, items: CartItem[]) { writes.push({ user, items: structuredClone(items) }); db[user] = structuredClone(items); },
  };
  const sync = createCartSync(store, remote);
  return { store, sync, db, reads, writes, remote };
}

test('remover e esvaziar persistem inclusive [] e não voltam após navegação ou novo login', async () => {
  const { store, sync, db, reads } = setup();
  await sync.activate('A');
  store.getState().removeItem('one');
  await sync.flush();
  assert.deepEqual(db.A.map(i => i.id), ['two']);
  await sync.activate('A'); // Navigation / token refresh cannot reload an old snapshot.
  assert.equal(reads.length, 1);
  store.getState().clearCart();
  await sync.flush();
  assert.deepEqual(db.A, []);
  await sync.activate(null);
  await sync.activate('A');
  assert.deepEqual(store.getState().items, []);
  sync.dispose();
});

test('sair preserva itens e quantidades, mas conta B não recebe itens da conta A', async () => {
  const { store, sync, db } = setup();
  await sync.activate('A');
  store.getState().decreaseItem('one');
  await sync.flush();
  await sync.activate(null);
  assert.deepEqual(store.getState().items, []);
  await sync.activate('B');
  assert.deepEqual(store.getState().items, db.B);
  await sync.activate(null);
  await sync.activate('A');
  assert.equal(store.getState().items[0].quantity, 1);
  assert.equal(store.getState().items[1].quantity, 2);
  sync.dispose();
});

test('uma leitura atrasada não desfaz uma exclusão durante a restauração', async () => {
  const gate = deferred<unknown>();
  const { store, sync: unused, remote, db } = setup(); unused.dispose();
  const sync = createCartSync(store, { ...remote, read: () => gate.promise });
  const loading = sync.activate('A');
  store.getState().clearCart();
  gate.resolve([item('old')]);
  await loading;
  await sync.flush();
  assert.deepEqual(store.getState().items, []);
  assert.deepEqual(db.A, []);
  sync.dispose();
});

test('resposta da conta anterior não altera o carrinho da nova conta', async () => {
  const gate = deferred<unknown>();
  const { store, sync: unused, remote, db } = setup(); unused.dispose();
  const sync = createCartSync(store, { ...remote, read: user => user === 'A' ? gate.promise : remote.read(user) });
  const first = sync.activate('A');
  await sync.activate('B');
  gate.resolve([item('from-A')]);
  await first;
  assert.equal(store.getState().ownerId, 'B');
  assert.deepEqual(store.getState().items, db.B);
  sync.dispose();
});

test('gravações são sequenciais e exclusão vence uma gravação anterior em andamento', async () => {
  const gate = deferred<void>();
  const started = deferred<void>();
  const { store, sync: unused, remote, db, writes } = setup(); unused.dispose();
  let first = true;
  const sync = createCartSync(store, { ...remote, async write(user, items) {
    if (first) { first = false; started.resolve(); await gate.promise; }
    await remote.write(user, items);
  } });
  await sync.activate('A');
  store.getState().decreaseItem('one');
  await started.promise;
  store.getState().clearCart();
  gate.resolve();
  await sync.flush();
  assert.equal(writes.length, 2);
  assert.deepEqual(db.A, []);
  assert.equal(store.getState().accountCarts.A.dirty, false);
  sync.dispose();
});

test('falha de rede mantém exclusão pendente após recarregar, sem restaurar o banco antigo', async () => {
  const { store, sync: unused, remote, db } = setup(); unused.dispose();
  const sync = createCartSync(store, { ...remote, async write() { throw new Error('offline'); } });
  await sync.activate('A');
  store.getState().clearCart();
  await assert.rejects(sync.flush(), /offline/);
  assert.equal(store.getState().accountCarts.A.dirty, true);
  const restored = createStore(createCartState);
  restored.setState({ ownerId: 'A', items: [], accountCarts: structuredClone(store.getState().accountCarts) });
  sync.dispose();
  const retry = createCartSync(restored, remote);
  await retry.activate('A');
  assert.deepEqual(db.A, []);
  assert.deepEqual(restored.getState().items, []);
  retry.dispose();
});

test('carrinho visitante é adotado uma vez e não é transportado entre contas', async () => {
  const { store, sync, db } = setup();
  store.getState().addItem(item('guest'));
  await sync.activate('A');
  assert.equal(db.A[0].id, 'guest');
  await sync.activate('B');
  assert.deepEqual(store.getState().items, [item('other')]);
  sync.dispose();
});
