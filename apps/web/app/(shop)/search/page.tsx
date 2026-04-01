'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { apiClient, type ProductDoc } from '@/lib/api-client';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { useDebounce } from '@/hooks/use-debounce';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const debounced = useDebounce(q, 300);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!debounced) return;
    setLoading(true);
    apiClient.products
      .list({ q: debounced, limit: 40 })
      .then((res) => {
        setProducts(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }, [debounced]);

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {loading ? 'Buscando...' : `${total} resultado${total !== 1 ? 's' : ''} para "${q}"`}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!loading && products.length === 0 && q && (
        <p className="text-center py-12 text-muted-foreground">Sin resultados.</p>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Buscar</h1>
      <SearchBar />
      <Suspense fallback={<p>Cargando...</p>}>
        <SearchResults />
      </Suspense>
    </main>
  );
}
