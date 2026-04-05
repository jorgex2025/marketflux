'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', active: true, usageLimit: '', expiresAt: '' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/coupons`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setCoupons(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `${API}/coupons/${editing.id}` : `${API}/coupons`;
      const method = editing ? 'PUT' : 'POST';
      const body: any = { ...form, value: Number(form.value), active: form.active };
      if (form.usageLimit) body.usageLimit = Number(form.usageLimit);
      if (form.expiresAt) body.expiresAt = form.expiresAt;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast(editing ? 'Cupón actualizado' : 'Cupón creado', 'success');
      setShowForm(false);
      setEditing(null);
      setForm({ code: '', type: 'percentage', value: '', active: true, usageLimit: '', expiresAt: '' });
      load();
    } catch {
      toast('Error al guardar cupón', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    try {
      await fetch(`${API}/coupons/${id}`, { method: 'DELETE', credentials: 'include' });
      setCoupons((c) => c.filter((x) => x.id !== id));
      toast('Cupón eliminado', 'success');
    } catch {
      toast('Error al eliminar', 'error');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await fetch(`${API}/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...coupon, active: !coupon.active }),
      });
      setCoupons((c) => c.map((x) => x.id === coupon.id ? { ...x, active: !x.active } : x));
      toast('Estado actualizado', 'success');
    } catch {
      toast('Error al actualizar', 'error');
    }
  };

  const startEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({ code: coupon.code, type: coupon.type, value: String(coupon.value), active: coupon.active, usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '', expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '' });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cupones</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestiona los cupones de descuento de la plataforma.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ code: '', type: 'percentage', value: '', active: true, usageLimit: '', expiresAt: '' }); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
          <PlusIcon className="h-4 w-4" />Nuevo cupón
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">{editing ? 'Editar cupón' : 'Nuevo cupón'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">Código *</label>
              <input value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))} required className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VERANO20" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Tipo</label>
              <select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="percentage">Porcentaje %</option>
                <option value="fixed">Monto fijo $</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Valor *</label>
              <input type="number" value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))} required min="1" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Límite de usos</label>
              <input type="number" value={form.usageLimit} onChange={(e) => setForm((s) => ({ ...s, usageLimit: e.target.value }))} min="1" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Sin límite" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Expira</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay cupones creados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Código', 'Tipo', 'Valor', 'Usos', 'Expira', 'Estado', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">{c.type === 'percentage' ? '%' : '$'}</span></td>
                  <td className="px-4 py-3 font-medium">{c.type === 'percentage' ? `${c.value}%` : `$${c.value.toLocaleString('es-CO')}`}</td>
                  <td className="px-4 py-3">{c.usedCount ?? 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-CO') : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c)} className={`text-xs px-2 py-1 rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.active ? 'Activo' : 'Inactivo'}</button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-indigo-500 hover:text-indigo-700"><PencilIcon className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
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
