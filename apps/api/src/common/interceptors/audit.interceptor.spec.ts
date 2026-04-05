import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditInterceptor } from './audit.interceptor';
import { DrizzleService } from '../../database/database.module';
import { of, lastValueFrom } from 'rxjs';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let drizzleService: DrizzleService;

  const mockInsert = vi.fn().mockReturnThis();
  const mockValues = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnThis();
    mockValues.mockResolvedValue(undefined);
    drizzleService = { db: { insert: mockInsert, values: mockValues } } as unknown as DrizzleService;
    interceptor = new AuditInterceptor(drizzleService);
  });

  it('debería estar definido', () => {
    expect(interceptor).toBeDefined();
  });

  it('debería pasar sin auditar si el método es GET', () => {
    const ctx = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          method: 'GET',
          path: '/api/products',
          headers: {},
          user: { id: 'user1' },
        }),
      }),
    } as any;
    const next = { handle: vi.fn().mockReturnValue(of({ data: 'test' })) };
    const result = interceptor.intercept(ctx, next);
    expect(result).toBeDefined();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('debería registrar audit log para método POST', async () => {
    const ctx = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          method: 'POST',
          path: '/api/products',
          headers: {},
          user: { id: 'user1' },
          params: {},
          socket: { remoteAddress: '127.0.0.1' },
        }),
      }),
    } as any;
    const next = { handle: vi.fn().mockReturnValue(of({ id: '1' })) };
    await lastValueFrom(interceptor.intercept(ctx, next));
    await vi.waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('debería resolver entidad correctamente', () => {
    expect((interceptor as any).resolveEntity('/api/products/123')).toBe('products');
    expect((interceptor as any).resolveEntity('/api/orders')).toBe('orders');
    expect((interceptor as any).resolveEntity('/unknown')).toBe('');
  });

  it('debería resolver entity ID correctamente', () => {
    expect((interceptor as any).resolveEntityId('/api/products/123', { id: '123' })).toBe('123');
    expect((interceptor as any).resolveEntityId('/api/products/slug', { slug: 'slug' })).toBe('slug');
    expect((interceptor as any).resolveEntityId('/api/products', {})).toBeNull();
  });
});
