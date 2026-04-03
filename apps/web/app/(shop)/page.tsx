import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MarketFlux — Tienda',
  description: 'Explora miles de productos en MarketFlux',
};

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: string[];
  featured: boolean;
  storeId: string;
};

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/api/products?featured=true&limit=8`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json() as { data: Product[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function ShopHomePage() {
  const featured = await getFeaturedProducts();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-indigo-600 text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Bienvenido a MarketFlux</h1>
        <p className="text-lg text-indigo-100 mb-8">
          El marketplace donde encontrarás todo lo que necesitas
        </p>
        <Link
          href="/shop/search"
          className="inline-block bg-white text-indigo-700 font-semibold px-8 py-3 rounded-full
                     shadow hover:shadow-md transition"
        >
          Explorar productos
        </Link>
      </section>

      {/* Productos destacados */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Productos destacados</h2>

        {featured.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay productos destacados aún.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0] ?? `https://placehold.co/400x400/e0e7ff/6366f1?text=${encodeURIComponent(product.name)}`;

  return (
    <Link href={`/shop/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="aspect-square overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
          <p className="mt-1 text-indigo-600 font-bold">${parseFloat(product.price).toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}
