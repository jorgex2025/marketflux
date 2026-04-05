'use client';
import { useCallback } from 'react';
import { useCartStore } from '@/store/cart.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
}

export function useCart() {
  const store = useCartStore();

  const fetchCart = useCallback(async () => {
    store.setLoading(true);
    try {
      const res = await apiFetch('/cart');
      if (!res.ok) throw new Error('fetch cart failed');
      const { data } = await res.json();
      store.setCart(data?.items ?? [], data?.couponCode ?? null);
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const addItem = useCallback(
    async (productId: string, qty: number, variantId?: string) => {
      const res = await apiFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, qty, variantId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Error adding item');
      }
      await fetchCart();
    },
    [fetchCart],
  );

  const updateItem = useCallback(
    async (itemId: string, qty: number) => {
      // optimistic
      store.optimisticUpdateQty(itemId, qty);
      const res = await apiFetch(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ qty }),
      });
      if (!res.ok) {
        await fetchCart(); // rollback
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Error updating item');
      }
    },
    [store, fetchCart],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      store.optimisticRemove(itemId);
      const res = await apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) {
        await fetchCart(); // rollback
        throw new Error('Error removing item');
      }
    },
    [store, fetchCart],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      const res = await apiFetch('/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Cupón inválido');
      }
      const appliedCoupon = await res.json();
      store.setCoupon(appliedCoupon);
    },
    [store],
  );

  const removeCoupon = useCallback(async () => {
    await apiFetch('/cart/coupon', { method: 'DELETE' });
    store.setCoupon(null);
  }, [store]);

  return {
    items: store.items,
    couponCode: store.couponCode,
    isLoading: store.isLoading,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    clear: store.clear,
  };
}
