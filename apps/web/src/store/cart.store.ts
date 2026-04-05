import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  qty: number;
  quantity: number;
  unitPrice: number;
  name: string;
  imageUrl?: string | null;
  product: { name: string; imageUrl?: string | null };
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  coupon: Coupon | null;
  isLoading: boolean;
  isOpen: boolean;
  setCart: (items: CartItem[], coupon?: Coupon | null) => void;
  optimisticAdd: (item: CartItem) => void;
  optimisticRemove: (itemId: string) => void;
  optimisticUpdateQty: (itemId: string, qty: number) => void;
  setCoupon: (coupon: Coupon | null) => void;
  clearCart: () => void;
  clear: () => void;
  setLoading: (v: boolean) => void;
  setOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      coupon: null,
      isLoading: false,
      isOpen: false,

      setCart: (items, coupon = null) => set({ items, coupon, couponCode: coupon?.code || null }),

      optimisticAdd: (item) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId,
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === existing.id ? { 
                  ...i, 
                  qty: i.qty + item.qty, 
                  quantity: i.quantity + item.qty 
                } : i,
              ),
            };
          }
          return { 
            items: [...s.items, { 
              ...item, 
              quantity: item.qty,
              name: item.product?.name,
              imageUrl: item.product?.imageUrl
            }] 
          };
        }),

      optimisticRemove: (itemId) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== itemId) })),

      optimisticUpdateQty: (itemId, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === itemId ? { ...i, qty, quantity: qty } : i)),
        })),

      setCoupon: (coupon) => set({ coupon, couponCode: coupon?.code || null }),
      clear: () => set({ items: [], coupon: null, couponCode: null }),
      clearCart: () => set({ items: [], coupon: null, couponCode: null }),
      setLoading: (v) => set({ isLoading: v }),
      setOpen: (open: boolean) => set({ isOpen: open }),
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
