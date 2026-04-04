import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Auth - Registro, Login, y rutas protegidas
 */
test.describe('Auth API — E2E', () => {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const testEmail = `test+${Date.now()}@marketflux.dev`;
  const testPassword = 'Test1234!';

  test('POST /api/auth/register creates new user', async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });
    
    // Puede ser 201 (created) o 409 (conflict if exists)
    expect([201, 409]).toContain(res.status());
    
    if (res.status() === 201) {
      const body = await res.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email', testEmail);
    }
  });

  test('POST /api/auth/login returns token', async ({ request }) => {
    // Primero registrar
    await request.post(`${apiUrl}/api/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      },
    });

    // Luego login
    const res = await request.post(`${apiUrl}/api/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('access_token');
    expect(body.access_token).toBeTruthy();
  });

  test('POST /api/auth/login with wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/auth/login`, {
      data: {
        email: 'nonexistent@test.com',
        password: 'wrongpassword',
      },
    });
    
    expect(res.status()).toBe(401);
  });

  test('GET /api/auth/me without token returns 401', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/auth/me with invalid token returns 401', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid_token',
      },
    });
    expect(res.status()).toBe(401);
  });
});
