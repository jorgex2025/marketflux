const BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body?.error?.message ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ProductDoc {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  comparePrice: string | null;
  images: string[];
  stock: number;
  featured: boolean;
  status: string;
  storeId: string;
  categoryId: string | null;
  tags: string[];
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  country: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  children?: Category[];
}

export const apiClient = {
  baseUrl: BASE,

  products: {
    list: (params?: Record<string, string | number | boolean>) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch<PaginatedResponse<ProductDoc>>(`/products${qs}`);
    },
    bySlug: (slug: string) =>
      apiFetch<{ data: ProductDoc & { variants: unknown[] } }>(`/products/${slug}`),
    variants: (id: string) => apiFetch<{ data: unknown[] }>(`/products/${id}/variants`),
  },

  stores: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<PaginatedResponse<Store>>(`/stores${qs}`);
    },
    bySlug: (slug: string) => apiFetch<{ data: Store }>(`/stores/${slug}`),
    products: (slug: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<PaginatedResponse<ProductDoc>>(`/stores/${slug}/products${qs}`);
    },
  },

  categories: {
    tree: () => apiFetch<{ data: Category[] }>('/categories'),
    attributes: (id: string) => apiFetch<{ data: unknown[] }>(`/categories/${id}/attributes`),
  },
};
