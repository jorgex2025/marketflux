'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

export const metadata: Metadata = {
  title: 'Cupones — Vendedor | MarketFlux',
  description: 'Gestiona los cupones de descuento de tu tienda.',
};

export default function VendorCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', usageLimit: '', expiresAt: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/proxy/coupons?mine=true').then((r) => r.json()).then((d) => setCoupons(d.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/proxy/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, discountValue: Number(form.discountValue), usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setCoupons((c) => [created.data ?? created, ...c]);
      setForm({ code: '', discountType: 'percentage', discountValue: '', usageLimit: '', expiresAt: '' });
      toast('Cupón creado', 'success');
    } catch { toast('Error al crear cupón', 'error'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/proxy/coupons/${id}`, { method: 'DELETE' });
      setCoupons((c) => c.filter((x) => x.id !== id));
      toast('Cupón eliminado', 'info');
    } catch { toast('Error al eliminar', 'error'); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Cupones de descuento</h1>
      <form onSubmit={handleCreate} className="bg-white rounded-2xl border p-6 grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="text-sm font-medium">Código *</label>
          <input value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))} required className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="VERANO20" />
        </div>
        <div>
          <label className="text-sm font-medium">Tipo</label>
          <select value={form.discountType} onChange={(e) => setForm((s) => ({ ...s, discountType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
            <option value="percentage">Porcentaje %</option>
            <option value="fixed">Monto fijo $</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Valor *</label>
          <input type="number" value={form.discountValue} onChange={(e) => setForm((s) => ({ ...s, discountValue: e.target.value }))} required min="1" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Límite usos</label>
          <input type="number" value={form.usageLimit} onChange={(e) => setForm((s) => ({ ...s, usageLimit: e.target.value }))} min="1" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Sin límite" />
        </div>
        <div>
          <label className="text-sm font-medium">Expira</label>
          <input type="date" value={form.expiresAt} onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div className="col-span-2">
          <button type="submit" disabled={creating} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            <PlusIcon className="h-4 w-4" />{creating ? 'Creando...' : 'Crear cupón'}
          </button>
        </div>
      </form>
      <div className="bg-white rounded-2xl border overflow-hidden">
        {loading ? <div className="p-6 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div> : coupons.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No tienes cupones</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{['Código', 'Descuento', 'Usos', 'Expira', ''].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3">{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                  <td className="px-4 py-3">{c.usedCount ?? 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                  <td className="px-4 py-3 text-gray-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-CO') : '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
