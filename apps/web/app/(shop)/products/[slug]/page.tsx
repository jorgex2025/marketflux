import { notFound } from 'next/navigation';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { ProductVariantPicker } from '@/components/product-variant-picker';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const res = await apiClient.products.bySlug(slug);
    return { title: res.data.name, description: res.data.description ?? undefined };
  } catch {
    return { title: 'Producto no encontrado' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let product: Awaited<ReturnType<typeof apiClient.products.bySlug>>['data'];
  try {
    const res = await apiClient.products.bySlug(slug);
    product = res.data;
  } catch {
    notFound();
  }

  const images = product.images.length ? product.images : ['/placeholder-product.png'];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden border">
            <Image
              src={images[0]!}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.slice(1).map((src, i) => (
                <div key={i} className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden border">
                  <Image src={src} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              ${Number(product.price).toLocaleString('es-CO')}
            </span>
            {product.comparePrice && (
              <span className="text-lg text-muted-foreground line-through">
                ${Number(product.comparePrice).toLocaleString('es-CO')}
              </span>
            )}
          </div>

          {product.variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Variantes</p>
              <ProductVariantPicker variants={product.variants as Parameters<typeof ProductVariantPicker>[0]['variants']} />
            </div>
          )}

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <p className="text-sm">
            Stock: <span className="font-semibold">{product.stock}</span>
          </p>

          <button
            type="button"
            disabled={product.stock === 0}
            className="w-full rounded-xl bg-primary py-3 text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </main>
  );
}
