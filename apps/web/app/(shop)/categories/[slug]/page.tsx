import { apiClient } from '@/lib/api-client';
import { ProductCard } from '@/components/product-card';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await apiClient.categories.tree();
  const cat = categories.data.find((c) => c.slug === slug);
  return cat ? { title: cat.name } : { title: 'Categoría' };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const categoriesRes = await apiClient.categories.tree();
  const category = categoriesRes.data.find((c) => c.slug === slug);
  if (!category) notFound();

  const productsRes = await apiClient.products.list({ category: category.id, limit: 40 });

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      {category.description && (
        <p className="text-muted-foreground">{category.description}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {productsRes.data.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {productsRes.data.length === 0 && (
        <p className="text-center py-12 text-muted-foreground">No hay productos en esta categoría.</p>
      )}
    </main>
  );
}
