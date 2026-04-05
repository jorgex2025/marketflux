'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Devoluciones — Admin | MarketFlux',
  description: 'Gestiona las solicitudes de devolución y reembolso.',
};

interface ReturnItem {
  id: string;
  orderId: string;
  productName: string;
  buyerName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  amount: number;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  refunded: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/returns`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setReturns(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: ReturnItem['status']) => {
    try {
      const res = await fetch(`${API}/returns/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setReturns((r) => r.map((x) => x.id === id ? { ...x, status } : x));
      toast(`Estado actualizado a ${STATUS_LABELS[status]}`, 'success');
    } catch {
      toast('Error al actualizar estado', 'error');
    }
  };

  const filtered = filter === 'all' ? returns : returns.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Devoluciones</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestiona las solicitudes de devolución y reembolso.</p>
      </div>

      <div className="flex gap-2">
        {[{ key: 'all', label: 'Todas' }, { key: 'pending', label: 'Pendientes' }, { key: 'approved', label: 'Aprobadas' }, { key: 'rejected', label: 'Rechazadas' }, { key: 'refunded', label: 'Reembolsadas' }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay devoluciones en esta categoría.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Orden', 'Producto', 'Comprador', 'Razón', 'Monto', 'Estado', 'Fecha', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.orderId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-medium">{r.productName}</td>
                  <td className="px-4 py-3">{r.buyerName}</td>
                  <td className="px-4 py-3 max-w-48 truncate">{r.reason}</td>
                  <td className="px-4 py-3 font-bold">${Number(r.amount).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(r.id, 'approved')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200">Aprobar</button>
                          <button onClick={() => updateStatus(r.id, 'rejected')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200">Rechazar</button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button onClick={() => updateStatus(r.id, 'refunded')} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-200">Reembolsar</button>
                      )}
                    </div>
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
