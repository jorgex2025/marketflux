import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  qty: number;
  unitPrice: number;
  product: { name: string; imageUrl?: string | null };
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  isLoading: boolean;
  setCart: (items: CartItem[], coupon?: string | null) => void;
  optimisticAdd: (item: CartItem) => void;
  optimisticRemove: (itemId: string) => void;
  optimisticUpdateQty: (itemId: string, qty: number) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
  setLoading: (v: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      isLoading: false,

      setCart: (items, coupon = null) => set({ items, couponCode: coupon }),

      optimisticAdd: (item) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId,
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === existing.id ? { ...i, qty: i.qty + item.qty } : i,
              ),
            };
          }
          return { items: [...s.items, item] };
        }),

      optimisticRemove: (itemId) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== itemId) })),

      optimisticUpdateQty: (itemId, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === itemId ? { ...i, qty } : i)),
        })),

      setCoupon: (code) => set({ couponCode: code }),
      clear: () => set({ items: [], couponCode: null }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'mf-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Selectores memoizados
export const selectCartTotal = (s: CartState): number =>
  s.items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);

export const selectCartCount = (s: CartState): number =>
  s.items.reduce((acc, i) => acc + i.qty, 0);
