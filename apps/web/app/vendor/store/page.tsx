'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface StoreSettings {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  slug: string;
}

export default function StoreSettingsPage() {
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '', bannerUrl: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${API}/stores/mine`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        const data = res.data ?? res;
        setStore(data);
        if (data) {
          setForm({ name: data.name || '', description: data.description || '', logoUrl: data.logoUrl || '', bannerUrl: data.bannerUrl || '' });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setStore(updated.data ?? updated);
      toast('Tienda actualizada', 'success');
    } catch {
      toast('Error al actualizar tienda', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Configuración de la tienda</h1>
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Configuración de la tienda</h1>
        <p className="text-sm text-zinc-500 mt-1">Edita la información pública de tu tienda.</p>
      </div>

      {store?.bannerUrl && (
        <div className="rounded-2xl overflow-hidden h-40 bg-zinc-100">
          <img src={store.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700">Nombre de la tienda *</label>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mi Tienda" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Slug</label>
            <input value={store?.slug || ''} disabled className="w-full border border-zinc-200 bg-zinc-50 rounded-lg px-3 py-2 text-sm mt-1 text-zinc-400" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-700">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} rows={4} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe tu tienda..." />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">URL del logo</label>
            <input value={form.logoUrl} onChange={(e) => setForm((s) => ({ ...s, logoUrl: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">URL del banner</label>
            <input value={form.bannerUrl} onChange={(e) => setForm((s) => ({ ...s, bannerUrl: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
          </div>
        </div>
        {form.logoUrl && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">Vista previa del logo:</span>
            <img src={form.logoUrl} alt="Logo preview" className="w-12 h-12 rounded-xl object-cover border" />
          </div>
        )}
        <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
