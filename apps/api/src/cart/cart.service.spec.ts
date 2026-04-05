import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartService } from './cart.service';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    query: {
      carts: { findFirst: vi.fn() },
      products: { findFirst: vi.fn() },
      cartItems: { findFirst: vi.fn() },
      productVariants: { findFirst: vi.fn() },
      coupons: { findFirst: vi.fn() },
      inventoryReservations: { findFirst: vi.fn() },
    },
  },
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CartService(mockDrizzleService as any);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería tener método getCart', () => {
    expect(service.getCart).toBeDefined();
    expect(typeof service.getCart).toBe('function');
  });

  it('debería tener método addItem', () => {
    expect(service.addItem).toBeDefined();
    expect(typeof service.addItem).toBe('function');
  });

  it('debería tener método updateItem', () => {
    expect(service.updateItem).toBeDefined();
    expect(typeof service.updateItem).toBe('function');
  });

  it('debería tener método removeItem', () => {
    expect(service.removeItem).toBeDefined();
    expect(typeof service.removeItem).toBe('function');
  });

  it('debería tener método applyCoupon', () => {
    expect(service.applyCoupon).toBeDefined();
    expect(typeof service.applyCoupon).toBe('function');
  });

  it('debería tener método removeCoupon', () => {
    expect(service.removeCoupon).toBeDefined();
    expect(typeof service.removeCoupon).toBe('function');
  });

  it('debería tener método getAvailableStock', () => {
    expect(service.getAvailableStock).toBeDefined();
    expect(typeof service.getAvailableStock).toBe('function');
  });
});
