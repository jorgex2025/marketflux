'use client';

import type { Metadata } from 'next';
import { useState, useEffect } from 'react';

export const metadata: Metadata = {
  title: 'Detalle del pedido — MarketFlux',
  description: 'Revisa los detalles de tu pedido.',
};
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../hooks/use-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  total: string;
  product?: { name: string; images: string[]; slug: string };
};

type Order = {
  id: string;
  status: string;
  total: string;
  subtotal: string;
  discount: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente pago',  color: 'bg-yellow-100 text-yellow-700' },
  paid:       { label: 'Pagado',          color: 'bg-green-100 text-green-700' },
  processing: { label: 'Procesando',      color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Enviado',         color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Entregado',       color: 'bg-indigo-100 text-indigo-700' },
  cancelled:  { label: 'Cancelado',       color: 'bg-red-100 text-red-700' },
};

export default function OrderDetailPage() {
  const { id }         = useParams<{ id: string }>();
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [order,    setOrder]    = useState<Order | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr,  setCancelErr]  = useState<string | null>(null);

  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?from=/orders/${id}`);
    }
  }, [authLoading, isAuthenticated, router, id]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    fetch(`${API}/api/orders/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { data: Order }) => setOrder(d.data))
      .finally(() => setLoading(false));
  }, [isAuthenticated, id]);

  async function handleCancel() {
    if (!order) return;
    setCancelling(true);
    setCancelErr(null);
    try {
      const res = await fetch(`${API}/api/orders/${order.id}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const json = await res.json() as { data?: Order; error?: { message: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al cancelar');
      setOrder(json.data!);
    } catch (e: unknown) {
      setCancelErr(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setCancelling(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Pedido no encontrado.</p>
        <Link href="/orders" className="text-indigo-600 hover:underline">Volver a mis pedidos</Link>
      </div>
    );
  }

  const s = STATUS_LABEL[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };
  const hasDiscount = order.discount && parseFloat(order.discount) > 0;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Banner pago exitoso */}
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-8 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">¡Pago completado!</p>
            <p className="text-sm text-green-600">Tu pedido ha sido confirmado. Recibirás actualizaciones por email.</p>
          </div>
        </div>
      )}

      {paymentStatus === 'cancelled' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-8">
          <p className="font-semibold text-yellow-800">Pago cancelado</p>
          <p className="text-sm text-yellow-600">No se realizó ningún cargo. Puedes intentarlo de nuevo.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
          <h1 className="text-2xl font-bold text-gray-900">Detalle del pedido</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString('es-CO', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${s.color}`}>
          {s.label}
        </span>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {order.items.map((item, i) => {
          const img = item.product?.images?.[0]
            ?? `https://placehold.co/64x64/e0e7ff/6366f1?text=P`;
          return (
            <div
              key={item.id}
              className={`flex gap-4 p-4 ${i < order.items.length - 1 ? 'border-b' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={item.product?.name ?? 'Producto'}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.product?.name ?? item.productId}</p>
                <p className="text-sm text-gray-500">x{item.quantity} · ${parseFloat(item.unitPrice).toFixed(2)} c/u</p>
              </div>
              <p className="font-semibold text-gray-900">${parseFloat(item.total).toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {/* Totales */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${parseFloat(order.subtotal).toFixed(2)}</span>
        </div>
        {hasDiscount && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento{order.couponCode ? ` (${order.couponCode})` : ''}</span>
            <span>-${parseFloat(order.discount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-3">
          <span>Total</span>
          <span>${parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-4">
        <Link
          href="/orders"
          className="flex-1 text-center border rounded-xl py-3 text-sm font-medium hover:bg-gray-50"
        >
          Mis pedidos
        </Link>

        {order.status === 'pending' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold
                       hover:bg-red-600 disabled:opacity-50 transition"
          >
            {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
          </button>
        )}
      </div>

      {cancelErr && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{cancelErr}</p>
      )}
    </main>
  );
}
