'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../stores/cart-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export interface RemoteCartItem {
  id: string;
  productId: string;
  variantId?: string;
  qty: number;
  product: { name: string; price: number; imageUrl?: string };
}

export function useCart() {
  const qc = useQueryClient();
  const store = useCartStore();

  const query = useQuery({
    queryKey: ['cart'],
    queryFn: () =>
      apiFetch<{ data: { items: RemoteCartItem[]; couponCode?: string; discountAmount?: number } }>(
        '/api/cart',
      ),
    staleTime: 30_000,
  });

  const addItem = useMutation({
    mutationFn: (body: { productId: string; variantId?: string; qty: number }) =>
      apiFetch('/api/cart/items', { method: 'POST', body: JSON.stringify(body) }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['cart'] });
      const prev = qc.getQueryData(['cart']);
      store.addItem({
        id: `${vars.productId}-${vars.variantId ?? ''}`,
        productId: vars.productId,
        variantId: vars.variantId,
        name: 'Producto',
        price: 0,
        qty: vars.qty,
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['cart'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const updateQty = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      apiFetch(`/api/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ qty }) }),
    onMutate: ({ id, qty }) => store.updateQty(id, qty),
    onSettled: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/cart/items/${id}`, { method: 'DELETE' }),
    onMutate: (id) => store.removeItem(id),
    onSettled: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const applyCoupon = useMutation({
    mutationFn: (code: string) =>
      apiFetch('/api/cart/coupon', { method: 'POST', body: JSON.stringify({ code }) }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeCoupon = useMutation({
    mutationFn: () => apiFetch('/api/cart/coupon', { method: 'DELETE' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const remoteItems = query.data?.data.items ?? [];
  const total = store.total();
  const subtotal = store.subtotal();
  const coupon = store.coupon;
  const items = store.items;

  return {
    items,
    remoteItems,
    total,
    subtotal,
    coupon,
    isLoading: query.isLoading,
    addItem: addItem.mutate,
    updateQty: updateQty.mutate,
    removeItem: removeItem.mutate,
    applyCoupon: applyCoupon.mutate,
    removeCoupon: removeCoupon.mutate,
  };
}
