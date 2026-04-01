import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import * as authModule from '../../auth/auth.service';

vi.mock('../../auth/auth.service', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
  AuthService: class {},
}));

const mockContext = (headers: Record<string, string> = {}, isPublic = false) => ({
  getHandler: () => ({}),
  getClass: () => ({}),
  switchToHttp: () => ({
    getRequest: () => ({ headers, user: undefined, session: undefined }),
  }),
} as unknown as ExecutionContext);

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AuthGuard(reflector);
  });

  it('allows public routes without session', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const result = await guard.canActivate(mockContext());
    expect(result).toBe(true);
  });

  it('throws UnauthorizedException when no session', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    vi.mocked(authModule.auth.api.getSession).mockResolvedValue(null);
    await expect(guard.canActivate(mockContext())).rejects.toThrow(UnauthorizedException);
  });

  it('attaches user and session to request when session is valid', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const fakeSession = { user: { id: 'u1', role: 'buyer' }, session: { id: 's1' } };
    vi.mocked(authModule.auth.api.getSession).mockResolvedValue(fakeSession as never);

    const req = { headers: {}, user: undefined, session: undefined };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.user).toEqual(fakeSession.user);
    expect(req.session).toEqual(fakeSession.session);
  });
});
