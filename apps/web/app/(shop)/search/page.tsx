'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { AddToWishlistButton } from '@/components/wishlist/add-to-wishlist-button';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Product { id: string; name: string; slug: string; price: string; images?: string[]; stock: number; }
interface Category { id: string; name: string; slug: string; }

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const PER_PAGE = 12;

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (query) params.set('q', query);
    if (selectedCat) params.set('category', selectedCat);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    fetch(`${API}/api/products?${params}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d.data ?? []); setTotal(d.meta?.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, selectedCat, minPrice, maxPrice, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filtros */}
        <aside className="w-full md:w-60 flex-shrink-0 space-y-6">
          <div>
            <p className="font-semibold text-sm mb-2 flex items-center gap-1"><FunnelIcon className="h-4 w-4" />Filtros</p>
            <div className="space-y-3">
              <select
                value={selectedCat}
                onChange={(e) => { setSelectedCat(e.target.value); setPage(1); }}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
              <div className="flex gap-2">
                <input value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} placeholder="Mín $" className="w-full border rounded-lg px-2 py-2 text-sm" />
                <input value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Máx $" className="w-full border rounded-lg px-2 py-2 text-sm" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Search bar */}
          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Buscar productos..."
              className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Resultados */}
          <p className="text-sm text-gray-400 mb-4">{total} resultado{total !== 1 ? 's' : ''}</p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse"><div className="aspect-square bg-gray-200 rounded-xl mb-2" /><div className="h-3 bg-gray-200 rounded mb-1" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p>No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div key={p.id} className="group relative border rounded-2xl overflow-hidden hover:shadow-md transition">
                  <Link href={`/shop/products/${p.slug}`}>
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                      <p className="text-indigo-600 font-bold mt-1 text-sm">${Number(p.price).toLocaleString('es-CO')}</p>
                    </div>
                  </Link>
                  <div className="absolute top-2 right-2">
                    <AddToWishlistButton product={{ id: p.id, name: p.name, slug: p.slug, price: Number(p.price), imageUrl: p.images?.[0] }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
              <span className="text-sm self-center">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
