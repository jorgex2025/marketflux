'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Payout {
  id: string;
  vendorName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/payouts`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setPayouts(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Payout['status']) => {
    try {
      const res = await fetch(`${API}/payouts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setPayouts((p) => p.map((x) => x.id === id ? { ...x, status } : x));
      toast('Estado actualizado', 'success');
    } catch {
      toast('Error al actualizar estado', 'error');
    }
  };

  const filtered = filter === 'all' ? payouts : payouts.filter((p) => p.status === filter);
  const totalAmount = filtered.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Pagos a vendedores</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestiona los pagos y transferencias a vendedores.</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex gap-2">
          {[{ key: 'all', label: 'Todos' }, { key: 'pending', label: 'Pendientes' }, { key: 'processing', label: 'Procesando' }, { key: 'completed', label: 'Completados' }, { key: 'failed', label: 'Fallidos' }].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>{f.label}</button>
          ))}
        </div>
        <div className="ml-auto text-sm text-zinc-500">
          Total: <span className="font-bold text-zinc-900">${totalAmount.toLocaleString('es-CO')}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay pagos en esta categoría.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Vendedor', 'Monto', 'Método', 'Estado', 'Fecha', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{p.vendorName}</td>
                  <td className="px-4 py-3 font-bold text-indigo-600">${Number(p.amount).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-zinc-500">{p.method}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[p.status]}`}>{STATUS_LABELS[p.status]}</span></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(p.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(p.id, 'processing')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200">Procesar</button>
                          <button onClick={() => updateStatus(p.id, 'failed')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200">Fallido</button>
                        </>
                      )}
                      {p.status === 'processing' && (
                        <button onClick={() => updateStatus(p.id, 'completed')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200">Completar</button>
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
