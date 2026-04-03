import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { AddToWishlistButton } from '@/components/wishlist/add-to-wishlist-button';
import { ReviewList } from '@/components/reviews/review-list';
import { ReviewFormSection } from '@/components/reviews/review-form-section';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getProduct(slug: string) {
  const res = await fetch(`${API}/api/products/${slug}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error cargando producto');
  const data = await res.json();
  return data.data ?? data;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Producto no encontrado' };
  return {
    title: product.name,
    description: product.description ?? `Compra ${product.name} en MarketFlux`,
    openGraph: {
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-gray-600">Inicio</a>
        <span className="mx-2">/</span>
        <a href="/shop/search" className="hover:text-gray-600">Tienda</a>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Galería */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            {product.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt={`${product.name} ${i + 2}`} className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-indigo-600 font-medium mb-1">{product.store?.name ?? product.category?.name}</p>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-indigo-600">${Number(product.price).toLocaleString('es-CO')}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">${Number(product.compareAtPrice).toLocaleString('es-CO')}</span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">-{discountPct}%</span>
              </>
            )}
          </div>

          {/* Stock */}
          <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock > 10 ? 'En stock' : product.stock > 0 ? `¡Solo quedan ${product.stock}!` : 'Agotado'}
          </p>

          {/* Descripción */}
          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={Number(product.price)}
              imageUrl={product.images?.[0]}
              stock={product.stock}
              className="flex-1"
            />
            <AddToWishlistButton
              product={{ id: product.id, name: product.name, slug: params.slug, price: Number(product.price), imageUrl: product.images?.[0] }}
            />
          </div>

          {/* Atributos */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="border-t pt-4 space-y-2">
              {Object.entries(product.attributes).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="text-gray-500 capitalize min-w-24">{k}:</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-6">Reseñas del producto</h2>
          <Suspense fallback={<div className="animate-pulse h-40 bg-gray-100 rounded-xl" />}>
            <ReviewList productId={product.id} />
          </Suspense>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Escribe una reseña</h3>
          <ReviewFormSection productId={product.id} />
        </div>
      </div>
    </div>
  );
}
