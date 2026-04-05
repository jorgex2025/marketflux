'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Vendedores — Admin | MarketFlux',
  description: 'Gestiona el estado de las tiendas del marketplace.',
};

interface Vendor {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'banned';
  productsCount: number;
  salesTotal: number;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  banned: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  banned: 'Baneado',
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/vendors`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setVendors(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const updateStatus = async (vendor: Vendor, status: Vendor['status']) => {
    try {
      const res = await fetch(`${API}/vendors/${vendor.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setVendors((v) => v.map((x) => x.id === vendor.id ? { ...x, status } : x));
      toast(`Estado actualizado a ${STATUS_LABELS[status]}`, 'success');
    } catch {
      toast('Error al actualizar estado', 'error');
    }
  };

  const filtered = filter === 'all' ? vendors : vendors.filter((v) => v.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Tiendas / Vendedores</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestiona el estado de las tiendas del marketplace.</p>
      </div>

      <div className="flex gap-2">
        {[{ key: 'all', label: 'Todos' }, { key: 'active', label: 'Activos' }, { key: 'suspended', label: 'Suspendidos' }, { key: 'banned', label: 'Baneados' }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay tiendas en esta categoría.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Tienda', 'Email', 'Productos', 'Ventas', 'Estado', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{v.email}</td>
                  <td className="px-4 py-3">{v.productsCount ?? 0}</td>
                  <td className="px-4 py-3 font-medium">${Number(v.salesTotal ?? 0).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[v.status]}`}>{STATUS_LABELS[v.status]}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {v.status !== 'active' && <button onClick={() => updateStatus(v, 'active')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200">Activar</button>}
                      {v.status !== 'suspended' && <button onClick={() => updateStatus(v, 'suspended')} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full hover:bg-yellow-200">Suspender</button>}
                      {v.status !== 'banned' && <button onClick={() => updateStatus(v, 'banned')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200">Banear</button>}
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
