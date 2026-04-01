import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';

vi.mock('../database/database.module', () => ({
  db: {},
}));

vi.mock('better-auth', () => ({
  betterAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn(),
    },
  })),
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getAuth() returns the auth instance', () => {
    const instance = service.getAuth();
    expect(instance).toBeDefined();
    expect(instance.api).toBeDefined();
  });
});
