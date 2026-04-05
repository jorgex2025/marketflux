'use client';

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/toast-provider';

export const metadata: Metadata = {
  title: 'Mis productos — Vendedor | MarketFlux',
  description: 'Gestiona los productos de tu tienda.',
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();
  const PER_PAGE = 15;

export const metadata: Metadata = {
  title: 'Mis productos — MarketFlux',
  description: 'Gestiona los productos de tu tienda.',
};

  const fetchProducts = () => {
    setLoading(true);
    fetch(`/api/proxy/products?mine=true&page=${page}&limit=${PER_PAGE}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d.data ?? []); setTotal(d.meta?.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    try {
      const res = await fetch(`/api/proxy/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProducts((p) => p.filter((x) => x.id !== id));
      toast('Producto eliminado', 'success');
    } catch { toast('Error al eliminar', 'error'); }
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mis productos <span className="text-gray-400 text-lg">({total})</span></h1>
        <Link href="/vendor/products/new" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
          <PlusIcon className="h-4 w-4" />Nuevo producto
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Producto', 'Precio', 'Stock', 'Estado', 'Acciones'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />}
                    <span className="font-medium truncate max-w-48">{p.name}</span>
                  </td>
                  <td className="px-4 py-3">${Number(p.price).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3"><span className={p.stock <= 5 ? 'text-red-500 font-medium' : ''}>{p.stock}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/vendor/products/${p.id}/edit`} className="text-indigo-500 hover:text-indigo-700"><PencilIcon className="h-4 w-4" /></Link>
                      <button onClick={() => handleDelete(p.id, p.name)} className="text-red-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center p-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
              <span className="text-sm self-center">{page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
