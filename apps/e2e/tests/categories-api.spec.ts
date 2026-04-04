import { test, expect } from '@playwright/test';

/**
 * Tests E2E para API - Categorías
 * Verifica endpoints de categorías
 */
test.describe('Categories API — E2E', () => {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  test('GET /api/categories returns array', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/categories`);
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/categories returns categories with required fields', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/categories`);
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    if (body.data.length > 0) {
      const category = body.data[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
    }
  });

  test('GET /api/categories/:slug returns single category', async ({ request }) => {
    // Primero obtener una categoría de la lista
    const listRes = await request.get(`${apiUrl}/api/categories`);
    const listBody = await listRes.json();
    
    if (listBody.data.length > 0) {
      const slug = listBody.data[0].slug;
      const res = await request.get(`${apiUrl}/api/categories/${slug}`);
      expect(res.status()).toBe(200);
      
      const body = await res.json();
      expect(body).toHaveProperty('slug', slug);
    }
  });
});
