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

interface Coupon {
  code: string;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  setCoupon: (coupon: Coupon | null) => void;
  total: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, qty: item.qty ?? 1 },
            ],
          };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),

      clearCart: () => set({ items: [], coupon: null }),

      setCoupon: (coupon) => set({ coupon }),

      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.price * i.qty, 0),

      total: () => {
        const sub = get().subtotal();
        const discount = get().coupon?.discountAmount ?? 0;
        return Math.max(0, sub - discount);
      },
    }),
    { name: 'marketflux-cart' },
  ),
);
