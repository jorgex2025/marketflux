'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', parentId: '', order: '0' });
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const load = () =>
    fetch(`${API}/categories`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setCategories(res.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `${API}/categories/${editing.id}` : `${API}/categories`;
      const method = editing ? 'PUT' : 'POST';
      const body: any = { ...form, order: Number(form.order) };
      if (!form.parentId) body.parentId = null;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast(editing ? 'Categoría actualizada' : 'Categoría creada', 'success');
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', parentId: '', order: '0' });
      load();
    } catch {
      toast('Error al guardar categoría', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await fetch(`${API}/categories/${id}`, { method: 'DELETE', credentials: 'include' });
      setCategories((c) => c.filter((x) => x.id !== id));
      toast('Categoría eliminada', 'success');
    } catch {
      toast('Error al eliminar', 'error');
    }
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, parentId: cat.parentId || '', order: String(cat.order) });
    setShowForm(true);
  };

  const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const roots = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  const renderCategory = (cat: Category, depth: number) => {
    const children = getChildren(cat.id);
    const isExpanded = expanded[cat.id];
    return (
      <div key={cat.id}>
        <tr className="hover:bg-zinc-50">
          <td className="px-4 py-3" style={{ paddingLeft: `${depth * 24 + 16}px` }}>
            <div className="flex items-center gap-2">
              {children.length > 0 && (
                <button onClick={() => toggleExpand(cat.id)} className="text-zinc-400 hover:text-zinc-600">
                  {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                </button>
              )}
              <span className="font-medium">{cat.name}</span>
            </div>
          </td>
          <td className="px-4 py-3 text-zinc-500">{cat.slug}</td>
          <td className="px-4 py-3 text-zinc-500">{cat.order}</td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button onClick={() => startEdit(cat)} className="text-indigo-500 hover:text-indigo-700"><PencilIcon className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
            </div>
          </td>
        </tr>
        {isExpanded && children.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Categorías</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestiona el árbol de categorías del marketplace.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', parentId: '', order: '0' }); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
          <PlusIcon className="h-4 w-4" />Nueva categoría
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">Nombre *</label>
              <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Electrónica" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Categoría padre</label>
              <select value={form.parentId} onChange={(e) => setForm((s) => ({ ...s, parentId: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Ninguna (raíz)</option>
                {categories.filter((c) => !c.parentId || c.id !== (editing?.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Orden</label>
              <input type="number" value={form.order} onChange={(e) => setForm((s) => ({ ...s, order: e.target.value }))} min="0" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
      ) : roots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No hay categorías creadas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Nombre', 'Slug', 'Orden', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {roots.map((cat) => renderCategory(cat, 0))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
