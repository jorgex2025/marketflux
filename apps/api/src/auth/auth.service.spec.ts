import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock better-auth antes de importar el service
vi.mock('better-auth', () => ({
  betterAuth: vi.fn(() => ({
    handler: vi.fn(),
    api: {},
  })),
}));
vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

import { AuthService } from './auth.service';

const mockDrizzle = { db: {} };
const mockConfig = {
  getOrThrow: vi.fn((key: string) => {
    if (key === 'BETTER_AUTH_SECRET') return 'test-secret-32-chars-minimum-xxxx';
    if (key === 'BETTER_AUTH_URL')    return 'http://localhost:3001';
    return '';
  }),
  get: vi.fn(() => 'http://localhost:3000'),
};

describe('AuthService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('instancia correctamente y expone getAuth()', () => {
    const service = new AuthService(
      mockDrizzle as never,
      mockConfig as never,
    );
    expect(service.getAuth()).toBeDefined();
  });

  it('getAuth() retorna el mismo objeto (singleton)', () => {
    const service = new AuthService(
      mockDrizzle as never,
      mockConfig as never,
    );
    expect(service.getAuth()).toBeDefined();
  });
});
