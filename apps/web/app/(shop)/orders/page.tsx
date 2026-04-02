'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
}

interface OrdersMeta {
  total: number;
  page: number;
  pageSize: number;
}

async function fetchOrders(
  page: number,
): Promise<{ data: OrderSummary[]; meta: OrdersMeta }> {
  const res = await fetch(
    `${API}/api/orders?page=${page}&pageSize=10`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error('Error al cargar órdenes');
  return res.json() as Promise<{ data: OrderSummary[]; meta: OrdersMeta }>;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => fetchOrders(page),
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-gray-500">Cargando órdenes…</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-red-500">Error al cargar las órdenes.</p>
      </main>
    );
  }

  const orders = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Mis órdenes</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">No tienes órdenes todavía.</p>
      ) : (
        <>
          <ul className="divide-y">
            {orders.map((order) => (
              <li key={order.id} className="py-4">
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between hover:opacity-80"
                >
                  <div>
                    <p className="font-medium text-sm"># {order.id.slice(0, 8)}…</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                      {order.itemCount} artículo(s)
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-semibold">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border px-3 py-1 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
