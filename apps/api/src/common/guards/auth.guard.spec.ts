import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from:   vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where:  vi.fn().mockReturnThis(),
  limit:  vi.fn().mockResolvedValue([]),
};

const mockDrizzle = { db: mockDb };

function buildContext(overrides: {
  isPublic?: boolean;
  token?: string;
  session?: Record<string, unknown>;
}) {
  const reflector = new Reflector();
  vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(overrides.isPublic ?? false);

  const request = {
    cookies: overrides.token ? { 'better-auth.session_token': overrides.token } : {},
    headers: {},
    user: undefined as unknown,
  };

  mockDb.limit.mockResolvedValue(
    overrides.session ? [overrides.session] : [],
  );

  const ctx = {
    getHandler: () => ({}),
    getClass:   () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { guard: new AuthGuard(reflector, mockDrizzle as never), ctx, request };
}

describe('AuthGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('permite rutas públicas sin token', async () => {
    const { guard, ctx } = buildContext({ isPublic: true });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('lanza UnauthorizedException sin token', async () => {
    const { guard, ctx } = buildContext({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lanza UnauthorizedException con token inválido (sin sesión en DB)', async () => {
    const { guard, ctx } = buildContext({ token: 'invalid-token' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('inyecta user en request con sesión válida', async () => {
    const session = {
      sessionId: 'ses_1',
      userId: 'usr_1',
      expiresAt: new Date(Date.now() + 10_000),
      userRole: 'buyer',
      userName: 'Test User',
      userEmail: 'test@example.com',
    };
    const { guard, ctx, request } = buildContext({ token: 'valid-token', session });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect((request as { user: unknown }).user).toMatchObject({ id: 'usr_1', role: 'buyer' });
  });
});
