import type { StoreApi } from 'zustand';
import type { CartItem, CartStore } from '../store/useCartStore.ts';

export interface CartRemote {
  read: (userId: string) => Promise<unknown>;
  write: (userId: string, items: CartItem[]) => Promise<void>;
}

// One owner per session, one read per login and ordered writes, including [].
export function createCartSync(store: StoreApi<CartStore>, remote: CartRemote, onError: (error: unknown) => void = () => {}) {
  let owner: string | null | undefined;
  let generation = 0;
  let loading: Promise<void> | null = null;
  let loaded = false;
  const writes = new Map<string, Promise<void>>();

  function save(userId: string): Promise<void> {
    const existing = writes.get(userId);
    if (existing) return existing;
    const task = Promise.resolve().then(async () => {
      while (owner === userId) {
        const cart = store.getState().accountCarts[userId];
        if (!cart?.dirty) break;
        await remote.write(userId, cart.items);
        store.getState().markSaved(userId, cart.revision);
      }
    }).finally(() => { writes.delete(userId); });
    writes.set(userId, task);
    return task;
  }

  async function flush() {
    const userId = owner;
    if (!userId) return;
    if (loading) await loading;
    if (owner === userId) await save(userId);
  }

  async function activate(userId: string | null) {
    if (owner === userId && (loaded || loading)) return flush();
    owner = userId;
    const token = ++generation;
    loaded = false;
    loading = null;
    store.getState().selectOwner(userId);
    if (!userId) { loaded = true; return; }
    const cached = store.getState().accountCarts[userId];
    if (cached?.dirty) { loaded = true; return flush(); }
    const revision = cached?.revision ?? 0;
    const request = Promise.resolve().then(async () => {
      const items = await remote.read(userId);
      if (token !== generation) return;
      store.getState().restoreAccount(userId, items, revision);
      loaded = true;
    }).finally(() => { if (token === generation) loading = null; });
    loading = request;
    await request;
    if (token === generation) await flush();
  }

  const unsubscribe = store.subscribe((state, previous) => {
    if (!owner || state.ownerId !== owner) return;
    if (state.accountCarts[owner]?.revision !== previous.accountCarts[owner]?.revision) {
      void flush().catch(onError);
    }
  });
  return { activate, flush, dispose: unsubscribe };
}
