import type { MetadataRoute } from 'next';

// TODO: Fase 11 — sitemap dinámico con productos y tiendas
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'http://localhost:3000', lastModified: new Date() }];
}
