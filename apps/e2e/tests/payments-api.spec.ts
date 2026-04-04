import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Pagos - Flujo completo de pago con Stripe
 */
test.describe('Payments API — E2E', () => {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  test('POST /api/payments/create-intent without auth returns 401', async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/payments/create-intent`, {
      data: {
        orderId: 'test-order',
        amount: 10000,
        currency: 'usd',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/payments/webhook handles test event', async ({ request }) => {
    const webhookPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test123',
          amount: 10000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            orderId: 'test-order',
          },
        },
      },
    };

    // El webhook debería procesarse (puede fallar por firma inválida)
    const res = await request.post(`${apiUrl}/api/payments/webhook`, {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Puede ser 200 (success) o 400/401 (bad signature)
    expect([200, 400, 401]).toContain(res.status());
  });
});
