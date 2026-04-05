'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const metadata: Metadata = {
  title: 'Pedidos — Vendedor | MarketFlux',
  description: 'Gestiona los pedidos de tu tienda.',
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/proxy/orders?role=seller&limit=50')
      .then((r) => r.json())
      .then((d) => setOrders(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/proxy/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setOrders((o) => o.map((x) => x.id === id ? { ...x, status } : x));
      toast('Estado actualizado', 'success');
    } catch { toast('Error al actualizar estado', 'error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedidos de mi tienda</h1>
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Orden', 'Comprador', 'Total', 'Estado', 'Acción'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{o.buyer?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-bold">${Number(o.total ?? 0).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[o.status] ?? 'bg-gray-100 text-gray-500'}`}>{o.status}</span></td>
                  <td className="px-4 py-3">
                    {o.status === 'paid' && <button onClick={() => updateStatus(o.id, 'shipped')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200">Marcar enviado</button>}
                    {o.status === 'shipped' && <button onClick={() => updateStatus(o.id, 'delivered')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">Marcar entregado</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
