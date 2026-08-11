import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  estoque: number; // <- 1. AGORA O CARRINHO CONHECE O ESTOQUE FÍSICO!
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  decreaseItem: (id: string) => void; 
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);
        
        if (existingItem) {
          // 2. A TRAVA DE SEGURANÇA: Só soma +1 se a quantidade atual for menor que o estoque limite!
          if (existingItem.quantity < item.estoque) {
            set({
              items: currentItems.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            });
          }
          // Se a quantidade já for igual ao estoque, o código ignora o clique e não faz nada.
        } else {
          set({ items: [...currentItems, { ...item, quantity: 1 }] });
        }
      },

      decreaseItem: (id) => {
        const currentItems = get().items;
        set({
          items: currentItems.map((i) =>
            i.id === id && i.quantity > 1
              ? { ...i, quantity: i.quantity - 1 }
              : i
          ),
        });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);