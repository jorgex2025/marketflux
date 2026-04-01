'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ProductsFilters {
  q?: string;
  category?: string;
  store?: string;
  minPrice?: string;
  maxPrice?: string;
  featured?: boolean;
  limit?: number;
}

export function useInfiniteProducts(filters: ProductsFilters = {}) {
  const { limit = 20, ...rest } = filters;
  const params = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined && v !== ''),
  ) as Record<string, string>;

  return useInfiniteQuery({
    queryKey: ['products', 'infinite', params],
    queryFn: ({ pageParam }) =>
      apiClient.products.list({ ...params, page: pageParam as number, limit }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}
