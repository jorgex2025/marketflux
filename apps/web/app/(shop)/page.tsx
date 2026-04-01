import { Suspense } from 'react';
import { apiClient } from '@/lib/api-client';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';

export const revalidate = 60;

export default async function HomePage() {
  const [productsRes, categoriesRes] = await Promise.all([
    apiClient.products.list({ limit: 20, page: 1 }),
    apiClient.categories.tree(),
  ]);

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <SearchBar />
      </section>

      <section>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categoriesRes.data.map((cat) => (
            <a
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="shrink-0 rounded-full border px-4 py-1 text-sm hover:bg-accent transition-colors"
            >
              {cat.name}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Productos</h2>
        <Suspense fallback={<p>Cargando...</p>}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productsRes.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Suspense>
        {productsRes.data.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No hay productos disponibles.</p>
        )}
      </section>
    </main>
  );
}
