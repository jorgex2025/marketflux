'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface OrderItem {
  id: string;
  productName: string;
  qty: number;
  unitPrice: number;
  commissionRate: string;
}

interface OrderDetail {
  id: string;
  status: string;
  total: number;
  discountAmount: number;
  createdAt: string;
  items: OrderItem[];
  couponCode?: string;
}

async function fetchOrder(id: string): Promise<{ data: OrderDetail }> {
  const res = await fetch(`${API}/api/orders/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Orden no encontrada');
  return res.json() as Promise<{ data: OrderDetail }>;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
    enabled: Boolean(id),
  });

  const cancel = useMutation({
    mutationFn: () =>
      fetch(`${API}/api/orders/${id}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      }).then((r) => {
        if (!r.ok) throw new Error('No se pudo cancelar la orden');
        return r.json();
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['order', id] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p>Cargando orden…</p>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-red-500">Orden no encontrada.</p>
      </main>
    );
  }

  const order = data.data;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-indigo-600 hover:underline"
      >
        ← Mis órdenes
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Orden # {order.id.slice(0, 8)}…</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            STATUS_COLOR[order.status] ?? 'bg-gray-100'
          }`}
        >
          {order.status}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Creada el {new Date(order.createdAt).toLocaleString()}
      </p>

      <ul className="divide-y border rounded">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              {item.productName} × {item.qty}
            </span>
            <span>${(item.unitPrice * item.qty).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 text-sm">
        {order.couponCode && (
          <div className="flex justify-between text-green-600">
            <span>Cupón ({order.couponCode})</span>
            <span>−${order.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Tracking placeholder */}
      <div className="mt-6 rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400">
        📦 Tracking disponible en Fase 6 (Shipping)
      </div>

      {order.status === 'pending' && (
        <button
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
          className="mt-6 w-full rounded border border-red-500 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
        >
          {cancel.isPending ? 'Cancelando…' : 'Cancelar orden'}
        </button>
      )}
    </main>
  );
}
