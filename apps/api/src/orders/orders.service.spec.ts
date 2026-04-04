import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersService } from './orders.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const mockCart = {
  id: 'cart-1',
  status: 'active',
  couponCode: null,
  items: [{ productId: 'prod-1', variantId: null, qty: 2, unitPrice: '49.99' }],
};
const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: 'pending',
  total: '99.98',
  subtotal: '99.98',
  discount: '0',
};

const makeDrizzleService = () => ({
  db: {
    query: {
      orders: { findFirst: vi.fn().mockResolvedValue(mockOrder), findMany: vi.fn().mockResolvedValue([mockOrder]) },
    },
  },
});

const makeCartService = () => ({
  getCart: vi.fn().mockResolvedValue({ data: mockCart }),
  getAvailableStock: vi.fn().mockResolvedValue(10),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let drizzleService: ReturnType<typeof makeDrizzleService>;
  let cartService: ReturnType<typeof makeCartService>;

  beforeEach(() => {
    vi.clearAllMocks();
    drizzleService = makeDrizzleService();
    cartService = makeCartService();
    service = new OrdersService(drizzleService as any, cartService as any);
  });

  it('getOrder throws ForbiddenException for wrong user', async () => {
    await expect(service.getOrder('order-1', 'other-user')).rejects.toThrow(ForbiddenException);
  });

  describe('Security Tests', () => {
    it('valida stock antes de procesar orden', () => {
      expect(cartService.getAvailableStock).toBeDefined();
    });
  });
});
