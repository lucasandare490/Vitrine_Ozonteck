import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { isRetiredProduct } from '../lib/catalog-availability.ts';

export interface CartItem {
  id: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  estoque: number; 
}

export interface SavedCart {
  items: CartItem[];
  revision: number;
  dirty: boolean;
}

export interface CartStore {
  items: CartItem[];
  ownerId: string | null;
  accountCarts: Record<string, SavedCart>;
  selectOwner: (ownerId: string | null) => void;
  restoreAccount: (ownerId: string, items: unknown, revision: number) => void;
  markSaved: (ownerId: string, revision: number) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  replaceItems: (items: unknown) => void;
  decreaseItem: (id: string) => void; 
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === 'string'
    && typeof item.code === 'string'
    && typeof item.name === 'string'
    && typeof item.price === 'number'
    && Number.isFinite(item.price)
    && item.price >= 0
    && typeof item.quantity === 'number'
    && Number.isInteger(item.quantity)
    && item.quantity > 0
    && typeof item.estoque === 'number'
    && Number.isInteger(item.estoque)
    && item.estoque > 0;
}

export function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isCartItem)
    .filter((item) => !isRetiredProduct(item))
    .map((item) => ({
      ...item,
      quantity: Math.min(item.quantity, item.estoque, 100),
    }))
    .slice(0, 50);
}

export const createCartState: StateCreator<CartStore> = (set, get) => {
  const changeItems = (items: CartItem[]) => {
    const { ownerId, accountCarts } = get();
    set({ items, ...(ownerId ? { accountCarts: { ...accountCarts, [ownerId]: {
      items, revision: (accountCarts[ownerId]?.revision ?? 0) + 1, dirty: true,
    } } } : {}) });
  };
  return {
      items: [],
      ownerId: null,
      accountCarts: {},
      selectOwner: (ownerId) => {
        const current = get();
        if (current.ownerId === ownerId) return;
        // Only a genuine guest cart can be adopted by the account signing in.
        const guestItems = current.ownerId === null ? current.items : [];
        const cached = ownerId ? current.accountCarts[ownerId] : undefined;
        set({ ownerId, items: cached?.items ?? [] });
        if (ownerId && guestItems.length) changeItems(guestItems);
      },
      restoreAccount: (ownerId, value, revision) => {
        const state = get();
        const cached = state.accountCarts[ownerId];
        if (state.ownerId !== ownerId || cached?.dirty || (cached?.revision ?? 0) !== revision) return;
        const items = sanitizeCartItems(value);
        set({ items, accountCarts: { ...state.accountCarts, [ownerId]: { items, revision, dirty: false } } });
      },
      markSaved: (ownerId, revision) => {
        const state = get();
        const cached = state.accountCarts[ownerId];
        if (!cached || cached.revision !== revision) return;
        set({ accountCarts: { ...state.accountCarts, [ownerId]: { ...cached, dirty: false } } });
      },
      
      addItem: (item) => {
        if (isRetiredProduct(item)) return;
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);
        
        if (existingItem) {
          if (existingItem.quantity < item.estoque) {
            changeItems(currentItems.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ));
          }
        } else {
          changeItems([...currentItems, { ...item, quantity: 1 }]);
        }
      },

      replaceItems: (items) => changeItems(sanitizeCartItems(items)),

      decreaseItem: (id) => {
        const currentItems = get().items;
        changeItems(currentItems.map((i) =>
            i.id === id && i.quantity > 1
              ? { ...i, quantity: i.quantity - 1 }
              : i
          ));
      },

      removeItem: (id) => {
        changeItems(get().items.filter((i) => i.id !== id));
      },
      
      clearCart: () => changeItems([]),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    };
};

export const useCartStore = create<CartStore>()(
  persist(
    createCartState,
    {
      name: 'cart-storage',
      partialize: ({ items, ownerId, accountCarts }) => ({ items, ownerId, accountCarts }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CartStore> | undefined;
        const accountCarts: Record<string, SavedCart> = {};
        for (const [id, cart] of Object.entries(persisted?.accountCarts ?? {})) {
          if (!cart || typeof cart !== 'object') continue;
          accountCarts[id] = { items: sanitizeCartItems(cart.items), revision: Number.isSafeInteger(cart.revision) ? cart.revision : 0, dirty: cart.dirty === true };
        }
        return {
          ...currentState,
          ownerId: typeof persisted?.ownerId === 'string' ? persisted.ownerId : null,
          accountCarts,
          items: sanitizeCartItems(persisted?.items),
        };
      },
    }
  )
);
