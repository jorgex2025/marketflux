'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Banner {
  id: string;
  name: string;
  imageUrl: string;
  position: string;
  active: boolean;
  createdAt: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ name: '', imageUrl: '', position: 'home_hero', active: true });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/banners`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setBanners(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `${API}/banners/${editing.id}` : `${API}/banners`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast(editing ? 'Banner actualizado' : 'Banner creado', 'success');
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', imageUrl: '', position: 'home_hero', active: true });
      load();
    } catch {
      toast('Error al guardar banner', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return;
    try {
      await fetch(`${API}/banners/${id}`, { method: 'DELETE', credentials: 'include' });
      setBanners((b) => b.filter((x) => x.id !== id));
      toast('Banner eliminado', 'success');
    } catch {
      toast('Error al eliminar', 'error');
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await fetch(`${API}/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...banner, active: !banner.active }),
      });
      setBanners((b) => b.map((x) => x.id === banner.id ? { ...x, active: !x.active } : x));
      toast('Estado actualizado', 'success');
    } catch {
      toast('Error al actualizar', 'error');
    }
  };

  const startEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({ name: banner.name, imageUrl: banner.imageUrl, position: banner.position, active: banner.active });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Banners</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestiona los banners del marketplace.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', imageUrl: '', position: 'home_hero', active: true }); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <PlusIcon className="h-4 w-4" />Nuevo banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">{editing ? 'Editar banner' : 'Nuevo banner'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">Nombre *</label>
              <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Banner de verano" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">URL de imagen *</label>
              <input value={form.imageUrl} onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))} required className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Posición</label>
              <select value={form.position} onChange={(e) => setForm((s) => ({ ...s, position: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="home_hero">Home Hero</option>
                <option value="home_secondary">Home Secondary</option>
                <option value="category_top">Category Top</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay banners creados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Imagen', 'Nombre', 'Posición', 'Estado', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {banners.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3"><img src={b.imageUrl} alt={b.name} className="w-12 h-8 rounded-lg object-cover" /></td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">{b.position}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(b)} className={`text-xs px-2 py-1 rounded-full ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(b)} className="text-indigo-500 hover:text-indigo-700"><PencilIcon className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
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
