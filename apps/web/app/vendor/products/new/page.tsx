'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Nuevo producto — Vendedor | MarketFlux',
  description: 'Crea un nuevo producto para tu tienda.',
};

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', description: '', price: '', compareAtPrice: '',
    stock: '', sku: '', status: 'draft', categoryId: '',
    images: [] as string[], tags: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${API}/categories`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body: any = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast('Producto creado exitosamente', 'success');
      router.push('/vendor/products');
    } catch {
      toast('Error al crear producto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    setForm((s) => ({ ...s, images: [...s.images, ''] }));
  };

  const updateImage = (index: number, url: string) => {
    setForm((s) => ({ ...s, images: s.images.map((img, i) => i === index ? url : img) }));
  };

  const removeImage = (index: number) => {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendor/products" className="text-zinc-400 hover:text-zinc-600"><ArrowLeftIcon className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Nuevo producto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-700">Nombre *</label>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombre del producto" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-700">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} rows={4} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe tu producto..." />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Precio *</label>
            <input type="number" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} required min="0" step="0.01" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Precio anterior</label>
            <input type="number" value={form.compareAtPrice} onChange={(e) => setForm((s) => ({ ...s, compareAtPrice: e.target.value }))} min="0" step="0.01" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Opcional" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Stock</label>
            <input type="number" value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))} min="0" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">SKU</label>
            <input value={form.sku} onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="SKU-001" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Categoría</label>
            <select value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Estado</label>
            <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-zinc-700">Tags (separados por coma)</label>
            <input value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="tag1, tag2, tag3" />
          </div>
        </div>

        {/* Images */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-700">Imágenes</label>
            <button type="button" onClick={addImage} className="text-xs text-indigo-600 hover:text-indigo-700">+ Agregar URL</button>
          </div>
          <div className="space-y-2">
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <input value={img} onChange={(e) => updateImage(i, e.target.value)} className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
                <button type="button" onClick={() => removeImage(i)} className="text-red-400 hover:text-red-600 px-2">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-zinc-100">
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Creando...' : 'Crear producto'}
          </button>
          <Link href="/vendor/products" className="px-5 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-zinc-100">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
