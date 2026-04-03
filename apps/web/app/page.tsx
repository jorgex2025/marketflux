import { Suspense } from 'react';
import Link from 'next/link';

async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/products?featured=true&limit=8`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-24 px-6 text-center">
        <h1 className="text-5xl font-bold mb-4">El marketplace que conecta</h1>
        <p className="text-xl mb-8 opacity-90">Miles de vendedores, millones de productos</p>
        <Link
          href="/shop/search"
          className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-full hover:bg-indigo-50 transition"
        >
          Explorar tienda
        </Link>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <h2 className="text-2xl font-bold mb-8">Productos destacados</h2>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid products={featured} />
        </Suspense>
      </section>
    </div>
  );
}

function ProductGrid({ products }: { products: any[] }) {
  if (!products.length) {
    return <p className="text-gray-500">No hay productos destacados aún.</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((p: any) => (
        <Link key={p.id} href={`/shop/products/${p.slug}`} className="group">
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
            {p.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
            )}
          </div>
          <p className="font-medium text-sm line-clamp-2">{p.name}</p>
          <p className="text-indigo-600 font-bold mt-1">${Number(p.price).toLocaleString('es-CO')}</p>
        </Link>
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
