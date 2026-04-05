import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: string[] | null;
  categoryId: string;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Categoría: ${slug} — MarketFlux`,
    description: `Productos en la categoría ${slug}`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let products: Product[] = [];
  try {
    const res = await fetch(`${API}/api/products?category=${slug}&limit=24`, { next: { revalidate: 60 } });
    if (!res.ok) notFound();
    const json = (await res.json()) as { data: Product[] };
    products = json.data ?? [];
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">{slug}</h1>
        <p className="text-gray-500 mb-8">{products.length} producto{products.length !== 1 ? 's' : ''}</p>

        {products.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No hay productos en esta categoría.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
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
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
          <p className="mt-1 text-indigo-600 font-bold">${parseFloat(product.price).toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}
