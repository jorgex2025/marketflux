'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', processing: 'Procesando',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado',
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 10;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/proxy/orders?page=${page}&limit=${PER_PAGE}`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.data ?? []); setTotal(d.meta?.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis pedidos</h1>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingBagIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Aún no tienes pedidos</p>
          <Link href="/shop/search" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">Ir a la tienda</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between border rounded-xl px-5 py-4 hover:border-indigo-400 transition group">
              <div>
                <p className="font-medium text-sm">Orden #{o.id.slice(0, 8)}…</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                <p className="font-bold text-sm">${Number(o.total ?? 0).toLocaleString('es-CO')}</p>
              </div>
            </Link>
          ))}
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
              <span className="text-sm self-center">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
