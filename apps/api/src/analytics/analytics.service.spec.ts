import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics.service';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    query: {
      orders: { findFirst: vi.fn() },
      products: { findFirst: vi.fn() },
      stores: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
      orderItems: { findFirst: vi.fn() },
    },
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AnalyticsService(mockDrizzleService as any);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería tener método getSellerSummary', () => {
    expect(service.getSellerSummary).toBeDefined();
    expect(typeof service.getSellerSummary).toBe('function');
  });

  it('debería tener método getSellerTopProducts', () => {
    expect(service.getSellerTopProducts).toBeDefined();
    expect(typeof service.getSellerTopProducts).toBe('function');
  });

  it('debería tener método getSellerRevenueByDay', () => {
    expect(service.getSellerRevenueByDay).toBeDefined();
    expect(typeof service.getSellerRevenueByDay).toBe('function');
  });

  it('debería tener método getAdminSummary', () => {
    expect(service.getAdminSummary).toBeDefined();
    expect(typeof service.getAdminSummary).toBe('function');
  });

  it('debería tener método getAdminTopStores', () => {
    expect(service.getAdminTopStores).toBeDefined();
    expect(typeof service.getAdminTopStores).toBe('function');
  });

  it('debería tener método getAdminGmvByDay', () => {
    expect(service.getAdminGmvByDay).toBeDefined();
    expect(typeof service.getAdminGmvByDay).toBe('function');
  });

  it('debería tener método getAdminOrderStatusBreakdown', () => {
    expect(service.getAdminOrderStatusBreakdown).toBeDefined();
    expect(typeof service.getAdminOrderStatusBreakdown).toBe('function');
  });
});
