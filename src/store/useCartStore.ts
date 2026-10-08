import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  id: string;
  title: string;
  basePrice: number;
  images: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  variantName?: string;
  product: CartProduct;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  addItem: (
    product: CartProduct,
    quantity?: number,
    variantId?: string,
    variantName?: string,
    priceOffset?: number
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  syncWithServer: () => Promise<void>;
  loadServerCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, variantId, variantName, priceOffset = 0) => {
        set((state) => {
          const itemId = variantId ? `${product.id}-${variantId}` : product.id;
          const unitPrice = Math.max(0, product.basePrice + (priceOffset || 0));
          const existingIndex = state.items.findIndex((i) => i.id === itemId);

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += quantity;
            return { items: updated };
          }

          const newItem: CartItem = {
            id: itemId,
            productId: product.id,
            variantId,
            variantName,
            product,
            quantity,
            price: unitPrice,
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      syncWithServer: async () => {
        try {
          const currentItems = get().items;
          await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: currentItems.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            }),
          });
        } catch (err) {
          console.warn('[CART_SYNC_WARN] Failed to sync cart with server:', err);
        }
      },

      loadServerCart: async () => {
        try {
          const res = await fetch('/api/cart');
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.items) && data.items.length > 0) {
            set({
              items: data.items.map((i: any) => ({
                id: i.variantId ? `${i.productId}-${i.variantId}` : i.productId,
                productId: i.productId,
                variantId: i.variantId || undefined,
                variantName: i.variantName || undefined,
                product: {
                  id: i.productId,
                  title: i.title,
                  basePrice: i.price,
                  images: i.images || [],
                },
                quantity: i.quantity,
                price: i.price,
              })),
            });
          }
        } catch (err) {
          console.warn('[CART_LOAD_WARN] Failed to load server cart:', err);
        }
      },
    }),
    {
      name: 'nexmart-cart-storage',
    }
  )
);
