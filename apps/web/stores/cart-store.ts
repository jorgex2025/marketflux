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

export interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  hydrateCart: (payload: { items: CartItem[]; coupon: Coupon | null }) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,

      hydrateCart: ({ items, coupon }) => set({ items, coupon }),

      clearCart: () => set({ items: [], coupon: null }),
    }),
    { name: 'marketflux-cart' },
  ),
);

// ─── Selectores puros (no se serializan con persist) ───────────────────────

export const selectSubtotal = (s: CartState): number =>
  s.items.reduce((acc, item) => acc + item.price * item.qty, 0);

export const selectTotal = (s: CartState): number => {
  const sub = s.items.reduce((acc, item) => acc + item.price * item.qty, 0);
  return Math.max(0, sub - (s.coupon?.discountAmount ?? 0));
};
