import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { MaintenanceGuard } from './maintenance.guard';
import { Reflector } from '@nestjs/core';
import { DrizzleService } from '../../database/database.module';

describe('MaintenanceGuard', () => {
  let guard: MaintenanceGuard;
  let reflector: Reflector;
  let drizzleService: DrizzleService;

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;
    drizzleService = { db: mockDb } as unknown as DrizzleService;
    guard = new MaintenanceGuard(reflector, drizzleService);
  });

  it('debería estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debería retornar true si la ruta es pública', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = { getHandler: vi.fn(), getClass: vi.fn() } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('debería retornar true si no está en mantenimiento', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockDb.limit.mockResolvedValueOnce([]);
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
      }),
    } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('debería retornar true si está en mantenimiento pero el usuario es admin', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockDb.limit.mockResolvedValueOnce([{ value: 'true' }]);
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user: { role: 'admin' } }),
      }),
    } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('debería lanzar ServiceUnavailableException si está en mantenimiento y el usuario no es admin', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockDb.limit.mockResolvedValueOnce([{ value: 'true' }]);
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user: { role: 'buyer' } }),
      }),
    } as any;
    await expect(guard.canActivate(context)).rejects.toThrow(ServiceUnavailableException);
  });

  it('debería lanzar ServiceUnavailableException si está en mantenimiento y no hay usuario', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockDb.limit.mockResolvedValueOnce([{ value: 'true' }]);
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
      }),
    } as any;
    await expect(guard.canActivate(context)).rejects.toThrow(ServiceUnavailableException);
  });
});
