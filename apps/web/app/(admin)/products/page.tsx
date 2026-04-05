'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/providers/toast-provider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Product {
  id: string;
  name: string;
  image?: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  vendorName: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  draft: 'Borrador',
  archived: 'Archivado',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();
  const PER_PAGE = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('q', search);
    fetch(`${API}/products?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => { setProducts(res.data ?? []); setTotal(res.meta?.total ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const updateStatus = async (product: Product, status: Product['status']) => {
    try {
      const res = await fetch(`${API}/products/${product.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setProducts((p) => p.map((x) => x.id === product.id ? { ...x, status } : x));
      toast('Estado actualizado', 'success');
    } catch {
      toast('Error al actualizar estado', 'error');
    }
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Productos</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestiona todos los productos del marketplace.</p>
      </div>

      <div className="flex gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos..." className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="flex gap-2">
          {[{ key: 'all', label: 'Todos' }, { key: 'active', label: 'Activos' }, { key: 'draft', label: 'Borradores' }, { key: 'archived', label: 'Archivados' }].map((f) => (
            <button key={f.key} onClick={() => { setStatusFilter(f.key); setPage(1); }} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${statusFilter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No se encontraron productos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>{['Producto', 'Vendedor', 'Precio', 'Stock', 'Estado', 'Fecha', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image && <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />}
                      <span className="font-medium truncate max-w-48">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{p.vendorName}</td>
                  <td className="px-4 py-3 font-medium">${Number(p.price).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3"><span className={p.stock <= 5 ? 'text-red-500 font-medium' : ''}>{p.stock}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[p.status]}`}>{STATUS_LABELS[p.status]}</span></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(p.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status === 'draft' && <button onClick={() => updateStatus(p, 'active')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200">Activar</button>}
                      {p.status === 'active' && <button onClick={() => updateStatus(p, 'archived')} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200">Archivar</button>}
                      {p.status === 'archived' && <button onClick={() => updateStatus(p, 'active')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200">Reactivar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center p-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border border-zinc-200 rounded-lg disabled:opacity-40">Anterior</button>
              <span className="text-sm self-center">{page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border border-zinc-200 rounded-lg disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
