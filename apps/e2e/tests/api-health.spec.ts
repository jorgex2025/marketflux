import { test, expect } from '@playwright/test';

/**
 * Tests de API directamente (sin UI)
 * Útiles para smoke tests post-deploy
 */
test.describe('API Health & Smoke Tests', () => {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  test('GET /health returns 200', async ({ request }) => {
    const res = await request.get(`${apiUrl}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('uptime');
  });

  test('GET /metrics returns prometheus text', async ({ request }) => {
    const res = await request.get(`${apiUrl}/metrics`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('http_requests_total');
  });

  test('GET /api/categories returns array', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/products returns paginated list', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
  });

  test('unauthenticated POST /api/cart returns 401', async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/cart`, {
      data: { productId: 'fake', quantity: 1 },
    });
    expect(res.status()).toBe(401);
  });
});
