'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCartStore } from '../../../stores/cart-store';
import { selectSubtotal, selectTotal } from '../../../stores/cart-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface PendingOrder {
  id: string;
  status: string;
  total: number;
  discountAmount: number;
  items: Array<{
    id: string;
    productName: string;
    qty: number;
    unitPrice: number;
  }>;
  couponCode?: string;
}

async function fetchPendingOrder(): Promise<PendingOrder | null> {
  const res = await fetch(`${API}/api/orders?page=1&pageSize=1&status=pending`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: PendingOrder[] };
  return json.data[0] ?? null;
}

async function createCheckoutSession(
  orderId: string,
): Promise<{ url: string }> {
  const res = await fetch(`${API}/api/payments/checkout-session`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(err.error?.message ?? 'Error al crear sesión de pago');
  }
  const json = (await res.json()) as { data: { url: string } };
  return json.data;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);

  const [checkoutError, setCheckoutError] = useState('');

  const orderQuery = useQuery({
    queryKey: ['pending-order'],
    queryFn: fetchPendingOrder,
    enabled: items.length > 0,
  });

  const checkoutMutation = useMutation({
    mutationFn: (orderId: string) => createCheckoutSession(orderId),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err: unknown) => {
      setCheckoutError(
        err instanceof Error ? err.message : 'Error al procesar el pago',
      );
    },
  });

  function handlePay() {
    const orderId = orderQuery.data?.id;
    if (!orderId) {
      setCheckoutError('No se encontró una orden pendiente. Vuelve al carrito.');
      return;
    }
    setCheckoutError('');
    checkoutMutation.mutate(orderId);
  }

  // ─── Estado: pago exitoso (redirect desde Stripe) ───
  if (paymentStatus === 'success') {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">¡Pago exitoso!</h1>
        <p className="text-gray-500 mb-6">Tu orden ha sido confirmada.</p>
        <button
          onClick={() => router.push('/orders')}
          className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
        >
          Ver mis órdenes
        </button>
      </main>
    );
  }

  // ─── Estado: pago cancelado ───
  if (paymentStatus === 'cancelled') {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-2">Pago cancelado</h1>
        <p className="text-gray-500 mb-6">Puedes intentarlo de nuevo.</p>
        <button
          onClick={() => router.push('/cart')}
          className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
        >
          Volver al carrito
        </button>
      </main>
    );
  }

  // ─── Carrito vacío ───
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-gray-500">
          Tu carrito está vacío.{' '}
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 hover:underline"
          >
            Sigue comprando
          </button>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Resumen del pedido</h1>

      {/* Items */}
      <ul className="divide-y border rounded mb-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between px-4 py-3 text-sm"
          >
            <span>
              {item.name} × {item.qty}
            </span>
            <span>${(item.price * item.qty).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {/* Totales */}
      <div className="space-y-1 text-sm border-t pt-4 mb-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {coupon && (
          <div className="flex justify-between text-green-600">
            <span>Cupón ({coupon.code})</span>
            <span>−${coupon.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base">
          <span>Total a pagar</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {checkoutError && (
        <p className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-600">
          {checkoutError}
        </p>
      )}

      <button
        onClick={handlePay}
        disabled={checkoutMutation.isPending || orderQuery.isLoading}
        className="w-full rounded bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {checkoutMutation.isPending
          ? 'Redirigiendo a Stripe…'
          : 'Pagar con Stripe'}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        Serás redirigido a Stripe para completar el pago de forma segura.
      </p>
    </main>
  );
}
