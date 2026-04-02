'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCartStore, type CartItem, type Coupon } from '../stores/cart-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Tipos de respuesta del backend ────────────────────────────────────────

interface CartResponseItem {
  id: string;
  productId: string;
  variantId?: string | null;
  qty: number;
  product: {
    name: string;
    price: number;
    imageUrl?: string | null;
  };
}

interface CartResponse {
  data: {
    items: CartResponseItem[];
    couponCode?: string | null;
    discountAmount?: number | null;
  };
}

// ─── Helper fetch ───────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(err.error?.message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ─── Mapper servidor → store ────────────────────────────────────────────────

function mapServerCart(res: CartResponse): {
  items: CartItem[];
  coupon: Coupon | null;
} {
  return {
    items: res.data.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      qty: item.qty,
      name: item.product.name,
      price: item.product.price,
      imageUrl: item.product.imageUrl ?? undefined,
    })),
    coupon:
      res.data.couponCode != null
        ? {
            code: res.data.couponCode,
            discountAmount: res.data.discountAmount ?? 0,
          }
        : null,
  };
}

// ─── Hook principal ─────────────────────────────────────────────────────────

export function useCart() {
  const qc = useQueryClient();
  const hydrateCart = useCartStore((s) => s.hydrateCart);
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const subtotal = useCartStore((s) => s.subtotal());
  const total = useCartStore((s) => s.total());

  // Fuente de verdad: backend
  const query = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiFetch<CartResponse>('/api/cart'),
    staleTime: 30_000,
  });

  // Sincronizar store desde respuesta del servidor (en efecto, no durante render)
  useEffect(() => {
    if (query.data) {
      hydrateCart(mapServerCart(query.data));
    }
  }, [query.data, hydrateCart]);

  // ─── Mutaciones — usan ids reales del backend ──────────────────────────

  const addItem = useMutation({
    mutationFn: (body: { productId: string; variantId?: string; qty: number }) =>
      apiFetch('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const updateQty = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      apiFetch(`/api/cart/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ qty }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/cart/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const applyCoupon = useMutation({
    mutationFn: (code: string) =>
      apiFetch('/api/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeCoupon = useMutation({
    mutationFn: () => apiFetch('/api/cart/coupon', { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  return {
    items,
    coupon,
    subtotal,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    addItem: addItem.mutate,
    updateQty: updateQty.mutate,
    removeItem: removeItem.mutate,
    applyCoupon: applyCoupon.mutate,
    removeCoupon: removeCoupon.mutate,
    isAddingItem: addItem.isPending,
    isUpdatingQty: updateQty.isPending,
    isRemovingItem: removeItem.isPending,
  };
}
