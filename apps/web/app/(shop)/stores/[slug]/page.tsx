import { notFound } from 'next/navigation';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { ProductCard } from '@/components/product-card';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const res = await apiClient.stores.bySlug(slug);
    return { title: res.data.name, description: res.data.description ?? undefined };
  } catch {
    return { title: 'Tienda no encontrada' };
  }
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let store: Awaited<ReturnType<typeof apiClient.stores.bySlug>>['data'];
  let productsRes: Awaited<ReturnType<typeof apiClient.stores.products>>;

  try {
    [{ data: store }, productsRes] = await Promise.all([
      apiClient.stores.bySlug(slug),
      apiClient.stores.products(slug),
    ]);
  } catch {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      {/* Banner */}
      {store.bannerUrl && (
        <div className="relative h-40 rounded-2xl overflow-hidden">
          <Image src={store.bannerUrl} alt={store.name} fill className="object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        {store.logoUrl ? (
          <Image
            src={store.logoUrl}
            alt={store.name}
            width={64}
            height={64}
            className="rounded-full border object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
            {store.name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          {store.description && <p className="text-muted-foreground">{store.description}</p>}
        </div>
      </div>

      {/* Products */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Productos ({productsRes.meta.total})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productsRes.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {productsRes.data.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Esta tienda no tiene productos.</p>
        )}
      </section>
    </main>
  );
}
