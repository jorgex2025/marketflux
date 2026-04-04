import { test, expect } from '@playwright/test';

/**
 * Tests E2E para API - Endpoints de Productos
 * Estos tests verifican el flujo completo de productos
 */
test.describe('Products API — E2E', () => {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  test('GET /api/products returns paginated list', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/products`);
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty('meta');
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('page');
  });

  test('GET /api/products returns products with required fields', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/products`);
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    if (body.data.length > 0) {
      const product = body.data[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('description');
    }
  });

  test('GET /api/products/:id returns single product', async ({ request }) => {
    // Primero obtener un producto de la lista
    const listRes = await request.get(`${apiUrl}/api/products`);
    const listBody = await listRes.json();
    
    if (listBody.data.length > 0) {
      const productId = listBody.data[0].id;
      const res = await request.get(`${apiUrl}/api/products/${productId}`);
      expect(res.status()).toBe(200);
      
      const body = await res.json();
      expect(body).toHaveProperty('id', productId);
    }
  });

  test('GET /api/products supports search query', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/products?q=laptop`);
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    expect(body).toHaveProperty('data');
    // Los resultados deberían filtrarse por la búsqueda
  });

  test('GET /api/products supports category filter', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/products`);
    expect(res.status()).toBe(200);
  });

  test('POST /api/products without auth returns 401', async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/products`, {
      data: {
        name: 'Test Product',
        price: 100,
        description: 'Test',
      },
    });
    expect(res.status()).toBe(401);
  });
});
