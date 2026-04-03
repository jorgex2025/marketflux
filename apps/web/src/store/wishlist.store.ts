import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  toggle: (item: WishlistItem) => void;
  hasItem: (id: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((s) => ({
          items: s.items.some((i) => i.id === item.id) ? s.items : [...s.items, item],
        })),

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      toggle: (item) => {
        const exists = get().items.some((i) => i.id === item.id);
        if (exists) {
          set((s) => ({ items: s.items.filter((i) => i.id !== item.id) }));
        } else {
          set((s) => ({ items: [...s.items, item] }));
        }
      },

      hasItem: (id) => get().items.some((i) => i.id === id),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'marketflux-wishlist',
    }
  )
);
