'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type WishlistItem = {
  id: string;
  productId: string;
  addedAt: string;
  product?: { id: string; name: string; slug: string; price: string; images: string[] | null };
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/wishlist`)
      .then((r) => r.json())
      .then((d) => setItems(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeItem = async (productId: string) => {
    try {
      const res = await fetch(`${API}/api/wishlist/items/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
      }
    } catch {}
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-xl mb-2" />
                <div className="h-3 bg-gray-200 rounded mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Lista de Deseos</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">💝</p>
            <p>Tu lista de deseos está vacía</p>
            <Link href="/shop/search" className="text-indigo-600 hover:underline mt-2 inline-block">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                <Link href={`/shop/products/${item.product?.slug ?? item.productId}`}>
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    {item.product?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.product?.name ?? 'Producto'}</h3>
                    <p className="mt-1 text-indigo-600 font-bold">${item.product ? parseFloat(item.product.price).toFixed(2) : '0.00'}</p>
                  </div>
                </Link>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-500"
                  title="Eliminar de la lista"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
