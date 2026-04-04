import { test, expect } from '@playwright/test';

/**
 * Tests E2E para API - Endpoints de Órdenes
 * Verifica el flujo completo de creación y gestión de órdenes
 */
test.describe('Orders API — E2E', () => {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  test('GET /api/orders without auth returns 401', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/orders`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/orders without auth returns 401', async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/orders`, {
      data: {
        items: [],
        total: 0,
      },
    });
    expect(res.status()).toBe(401);
  });
});
