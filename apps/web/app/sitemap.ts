import type { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

type Product = { slug: string; updatedAt: string };
type Category = { slug: string };
type Store = { slug: string };

async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/api/products?limit=1000`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Product[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API}/api/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Category[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchStores(): Promise<Store[]> {
  try {
    const res = await fetch(`${API}/api/stores?limit=1000`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Store[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, stores] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchStores(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/shop/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/shop/cart`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/shop/products/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const storePages: MetadataRoute.Sitemap = stores.map((s) => ({
    url: `${BASE_URL}/stores/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...storePages];
}
