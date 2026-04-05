import { useState, useCallback, useRef, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PAGE_SIZE = 12;

interface UseInfiniteProductsOptions {
  query?: string;
  categoryId?: string;
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  enabled?: boolean;
}

interface UseInfiniteProductsReturn {
  data: any[];
  hasNextPage: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  total: number;
}

export function useInfiniteProducts({
  query, categoryId, vendorId, minPrice, maxPrice, sort, enabled = true,
}: UseInfiniteProductsOptions = {}): UseInfiniteProductsReturn {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const hasMoreRef = useRef(true);

  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (query) params.set('q', query);
    if (categoryId) params.set('categoryId', categoryId);
    if (vendorId) params.set('vendorId', vendorId);
    if (minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    if (sort) params.set('sort', sort);
    return `${API}/products?${params}`;
  }, [query, categoryId, vendorId, minPrice, maxPrice, sort]);

  const fetchPage = useCallback(async (p: number, append: boolean) => {
    try {
      const res = await fetch(buildUrl(p));
      const json = await res.json();
      const items = json.data ?? [];
      const metaTotal = json.meta?.total ?? 0;
      setTotal(metaTotal);
      if (append) {
        setData((prev) => [...prev, ...items]);
      } else {
        setData(items);
      }
      hasMoreRef.current = items.length >= PAGE_SIZE && data.length + items.length < metaTotal;
    } catch {
      if (!append) setData([]);
    } finally {
      if (append) setIsFetchingNextPage(false);
      else setIsLoading(false);
    }
  }, [buildUrl, data.length]);

  useEffect(() => {
    if (!enabled) { setIsLoading(false); return; }
    setIsLoading(true);
    setPage(1);
    hasMoreRef.current = true;
    fetchPage(1, false);
  }, [enabled, query, categoryId, vendorId, minPrice, maxPrice, sort]);

  const fetchNextPage = useCallback(() => {
    if (!hasMoreRef.current || isFetchingNextPage) return;
    setIsFetchingNextPage(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, true);
  }, [page, isFetchingNextPage, fetchPage]);

  const refetch = useCallback(() => {
    setPage(1);
    hasMoreRef.current = true;
    fetchPage(1, false);
  }, [fetchPage]);

  return {
    data,
    hasNextPage: hasMoreRef.current,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    total,
  };
}
