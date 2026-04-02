import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  imageUrl?: string;
  price: number;
  qty: number;
}

export interface Coupon {
  code: string;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  hydrateCart: (payload: { items: CartItem[]; coupon: Coupon | null }) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      hydrateCart: ({ items, coupon }) => set({ items, coupon }),

      clearCart: () => set({ items: [], coupon: null }),

      subtotal: () =>
        get().items.reduce((acc, item) => acc + item.price * item.qty, 0),

      total: () => {
        const sub = get().subtotal();
        const discount = get().coupon?.discountAmount ?? 0;
        return Math.max(0, sub - discount);
      },
    }),
    { name: 'marketflux-cart' },
  ),
);
