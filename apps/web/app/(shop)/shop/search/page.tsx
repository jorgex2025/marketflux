'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Product = {
  id: string; name: string; slug: string;
  price: string; comparePrice?: string;
  images: string[]; featured: boolean; storeId: string;
};

type Category = {
  id: string; name: string; slug: string; children?: Category[];
};

export default function SearchPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [page,       setPage]       = useState(1);

  const q        = searchParams.get('q')        ?? '';
  const category = searchParams.get('category') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q)        params.set('q', q);
      if (category) params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('page', String(page));
      params.set('limit', '24');

      const res  = await fetch(`${API}/api/products?${params}`);
      const json = await res.json() as { data: Product[] };
      setProducts(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [q, category, minPrice, maxPrice, page]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => null);
  }, []);

  function applyFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setPage(1);
    router.push(`/shop/search?${p.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">
        {/* Sidebar filtros */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categorías</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => applyFilter('category', '')}
                  className={`text-sm w-full text-left px-2 py-1 rounded hover:bg-indigo-50
                    ${!category ? 'font-bold text-indigo-700' : 'text-gray-700'}`}
                >
                  Todas
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => applyFilter('category', cat.id)}
                    className={`text-sm w-full text-left px-2 py-1 rounded hover:bg-indigo-50
                      ${category === cat.id ? 'font-bold text-indigo-700' : 'text-gray-700'}`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Precio</h3>
            <div className="flex gap-2">
              <input
                type="number" placeholder="Min" value={minPrice}
                onChange={(e) => applyFilter('minPrice', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <input
                type="number" placeholder="Max" value={maxPrice}
                onChange={(e) => applyFilter('maxPrice', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </aside>

        {/* Grid productos */}
        <div className="flex-1">
          {/* Search bar */}
          <div className="mb-6">
            <input
              type="search" placeholder="Buscar productos..." defaultValue={q}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilter('q', (e.target as HTMLInputElement).value);
              }}
              className="w-full border rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No se encontraron productos</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((p) => (
                <Link key={p.id} href={`/shop/products/${p.slug}`} className="group block">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images?.[0] ?? `https://placehold.co/400x400/e0e7ff/6366f1?text=${encodeURIComponent(p.name)}`}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{p.name}</p>
                      <p className="mt-1 text-indigo-600 font-bold text-sm">${parseFloat(p.price).toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Paginación simple */}
          <div className="flex justify-center gap-4 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              Anterior
            </button>
            <span className="self-center text-sm text-gray-600">Pág. {page}</span>
            <button
              disabled={products.length < 24}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
