'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Commission {
  id: string;
  type: string;
  rate: number;
  description: string;
  active: boolean;
  createdAt: string;
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Commission | null>(null);
  const [form, setForm] = useState({ type: 'percentage', rate: '', description: '', active: true });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/commissions`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setCommissions(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `${API}/commissions/${editing.id}` : `${API}/commissions`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, rate: Number(form.rate) }),
      });
      if (!res.ok) throw new Error();
      toast(editing ? 'Comisión actualizada' : 'Comisión creada', 'success');
      setShowForm(false);
      setEditing(null);
      setForm({ type: 'percentage', rate: '', description: '', active: true });
      load();
    } catch {
      toast('Error al guardar comisión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta comisión?')) return;
    try {
      await fetch(`${API}/commissions/${id}`, { method: 'DELETE', credentials: 'include' });
      setCommissions((c) => c.filter((x) => x.id !== id));
      toast('Comisión eliminada', 'success');
    } catch {
      toast('Error al eliminar', 'error');
    }
  };

  const startEdit = (comm: Commission) => {
    setEditing(comm);
    setForm({ type: comm.type, rate: String(comm.rate), description: comm.description, active: comm.active });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Comisiones</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestiona las tasas de comisión del marketplace.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ type: 'percentage', rate: '', description: '', active: true }); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
          <PlusIcon className="h-4 w-4" />Nueva comisión
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">{editing ? 'Editar comisión' : 'Nueva comisión'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">Tipo</label>
              <select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="percentage">Porcentaje %</option>
                <option value="fixed">Monto fijo $</option>
                <option value="tiered">Escalonado</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Tasa *</label>
              <input type="number" value={form.rate} onChange={(e) => setForm((s) => ({ ...s, rate: e.target.value }))} required min="0" step="0.01" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="10" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-zinc-700">Descripción</label>
              <input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Comisión estándar para productos" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700">Activa</span>
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
      ) : commissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay comisiones configuradas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Tipo', 'Tasa', 'Descripción', 'Estado', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3"><span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">{c.type}</span></td>
                  <td className="px-4 py-3 font-bold">{c.type === 'percentage' ? `${c.rate}%` : `$${c.rate.toLocaleString('es-CO')}`}</td>
                  <td className="px-4 py-3 text-zinc-500">{c.description || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.active ? 'Activa' : 'Inactiva'}</span></td>
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
