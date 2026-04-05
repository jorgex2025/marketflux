import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  it('debería estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debería retornar true si no hay roles requeridos', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn(),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debería retornar true si roles requeridos está vacío', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn(),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debería lanzar ForbiddenException si no hay usuario', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user: null }),
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debería lanzar ForbiddenException si el usuario no tiene el rol requerido', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { id: '1', role: 'buyer' },
        }),
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debería retornar true si el usuario tiene el rol requerido', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { id: '1', role: 'admin' },
        }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debería retornar true si el usuario tiene uno de los roles requeridos', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'seller']);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { id: '1', role: 'seller' },
        }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });
});
