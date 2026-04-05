'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Dispute {
  id: string;
  orderId: string;
  buyerName: string;
  vendorName: string;
  reason: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta',
  in_review: 'En revisión',
  resolved: 'Resuelta',
  closed: 'Cerrada',
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/disputes`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setDisputes(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const resolveDispute = async (id: string, status: 'resolved' | 'closed') => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/disputes/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, resolution }),
      });
      if (!res.ok) throw new Error();
      toast('Disputa resuelta', 'success');
      setSelected(null);
      setResolution('');
      load();
    } catch {
      toast('Error al resolver disputa', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'all' ? disputes : disputes.filter((d) => d.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Disputas</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestiona y resuelve las disputas del marketplace.</p>
      </div>

      <div className="flex gap-2">
        {[{ key: 'all', label: 'Todas' }, { key: 'open', label: 'Abiertas' }, { key: 'in_review', label: 'En revisión' }, { key: 'resolved', label: 'Resueltas' }, { key: 'closed', label: 'Cerradas' }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>{f.label}</button>
        ))}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Resolver disputa</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-zinc-500">Orden:</span> <span className="font-mono ml-1">{selected.orderId.slice(0, 8)}</span></div>
            <div><span className="text-zinc-500">Comprador:</span> <span className="ml-1">{selected.buyerName}</span></div>
            <div><span className="text-zinc-500">Vendedor:</span> <span className="ml-1">{selected.vendorName}</span></div>
            <div><span className="text-zinc-500">Razón:</span> <span className="ml-1">{selected.reason}</span></div>
          </div>
          <p className="text-sm text-zinc-600 bg-zinc-50 rounded-lg p-3">{selected.description}</p>
          <div>
            <label className="text-sm font-medium text-zinc-700">Resolución</label>
            <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe la resolución..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => resolveDispute(selected.id, 'resolved')} disabled={submitting || !resolution} className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">Resolver a favor</button>
            <button onClick={() => resolveDispute(selected.id, 'closed')} disabled={submitting || !resolution} className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">Cerrar disputa</button>
            <button onClick={() => { setSelected(null); setResolution(''); }} className="px-5 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay disputas en esta categoría.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Orden', 'Comprador', 'Vendedor', 'Razón', 'Estado', 'Fecha', 'Acción'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs">{d.orderId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{d.buyerName}</td>
                  <td className="px-4 py-3">{d.vendorName}</td>
                  <td className="px-4 py-3 max-w-48 truncate">{d.reason}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[d.status]}`}>{STATUS_LABELS[d.status]}</span></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(d.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    {(d.status === 'open' || d.status === 'in_review') && (
                      <button onClick={() => setSelected(d)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200">Resolver</button>
                    )}
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
