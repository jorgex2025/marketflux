import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AddToCartButton from '../../../../../components/catalog/AddToCartButton';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Product = {
  id: string; name: string; slug: string;
  description?: string; price: string; comparePrice?: string;
  images: string[]; stock: number; featured: boolean;
  storeId: string; categoryId?: string; status: string;
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/api/products/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Producto no encontrado' };
    const p = await res.json() as Product;
    return {
      title: `${p.name} | MarketFlux`,
      description: p.description ?? `Compra ${p.name} en MarketFlux`,
    };
  } catch { return { title: 'MarketFlux' }; }
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const res = await fetch(`${API}/api/products/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) notFound();
  const product = await res.json() as Product;

  const mainImage = product.images?.[0]
    ?? `https://placehold.co/600x600/e0e7ff/6366f1?text=${encodeURIComponent(product.name)}`;

  const hasDiscount = product.comparePrice &&
    parseFloat(product.comparePrice) > parseFloat(product.price);

  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.comparePrice!)) * 100)
    : 0;

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-gray-700">Inicio</Link>
        {' / '}
        <Link href="/shop/search" className="hover:text-gray-700">Tienda</Link>
        {' / '}
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Galería */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-indigo-600">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-gray-400 line-through text-lg">
                  ${parseFloat(product.comparePrice!).toFixed(2)}
                </span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  -{discountPct}%
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-600">
              {product.stock > 0 ? `${product.stock} en stock` : 'Sin stock'}
            </span>
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          <AddToCartButton product={product} />
        </div>
      </div>
    </main>
  );
}
