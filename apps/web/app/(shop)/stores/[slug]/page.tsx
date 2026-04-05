import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Store = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  rating: number;
  productCount: number;
  products: { id: string; name: string; slug: string; price: string; images: string[] | null }[];
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/api/stores/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Tienda no encontrada' };
    const json = (await res.json()) as { data: Store };
    return {
      title: `${json.data.name} — MarketFlux`,
      description: json.data.description ?? `Tienda ${json.data.name} en MarketFlux`,
    };
  } catch {
    return { title: 'Tienda' };
  }
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let store: Store;
  try {
    const res = await fetch(`${API}/api/stores/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) notFound();
    const json = (await res.json()) as { data: Store };
    store = json.data;
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
        {store.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.banner} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
        {/* Store Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 overflow-hidden">
              {store.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                store.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
              {store.description && (
                <p className="text-gray-500 mt-1">{store.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-6 mt-4 text-sm text-gray-500">
            <span>⭐ {store.rating.toFixed(1)}</span>
            <span>{store.productCount} productos</span>
          </div>
        </div>

        {/* Products */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Productos de {store.name}</h2>
        {store.products.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Esta tienda aún no tiene productos.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {store.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ProductCard({ product }: { product: { id: string; name: string; slug: string; price: string; images: string[] | null } }) {
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
