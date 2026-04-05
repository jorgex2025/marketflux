'use client';

import type { Metadata } from 'next';
import { useState, useEffect } from 'react';

export const metadata: Metadata = {
  title: 'Mis pedidos — MarketFlux',
  description: 'Consulta el historial y estado de tus pedidos.',
};
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/use-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type OrderItem = { id: string; productId: string; quantity: number; unitPrice: string; total: string };
type Order = {
  id: string;
  status: string;
  total: string;
  subtotal: string;
  discount: string;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700' },
  paid:       { label: 'Pagado',      color: 'bg-green-100 text-green-700' },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Enviado',     color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Entregado',  color: 'bg-indigo-100 text-indigo-700' },
  cancelled:  { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
};

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?from=/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetch(`${API}/api/orders?page=${page}&limit=10`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { data: Order[]; meta: { total: number } }) => {
        setOrders(d.data ?? []);
        setTotal(d.meta?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, page]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Aún no tienes pedidos.</p>
          <Link href="/shop/search" className="text-indigo-600 hover:underline">Explorar productos</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const s = STATUS_LABEL[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      #{order.id.slice(0, 8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('es-CO')}
                    </p>
                    <p className="text-sm text-gray-600">{order.items.length} producto(s)</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-1 ${s.color}`}>
                      {s.label}
                    </span>
                    <p className="font-bold text-gray-900">${parseFloat(order.total).toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {total > 10 && (
        <div className="flex justify-center gap-4 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
          >Anterior</button>
          <span className="self-center text-sm text-gray-600">Pág. {page}</span>
          <button
            disabled={orders.length < 10}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
          >Siguiente</button>
        </div>
      )}
    </main>
  );
}
