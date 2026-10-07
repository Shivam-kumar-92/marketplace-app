// Note: You may need to run `npx prisma generate` after installing prisma for this to not error on import
// import { Product } from '@prisma/client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Temporarily defining Product here until Prisma is fully generated to avoid TS errors
export interface Product {
    id: string;
    title: string;
    basePrice: number;
    images: string[];
}

export interface CartItem {
  id: string; 
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex((i) => i.product.id === product.id);
          
          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += quantity;
            return { items: newItems };
          }
          
          return { items: [...state.items, { id: product.id, product, quantity }] };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }));
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) => 
            item.id === id ? { ...item, quantity } : item
          )
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.product.basePrice * item.quantity), 0);
      }
    }),
    {
      name: 'nexmart-cart-storage',
    }
  )
);
