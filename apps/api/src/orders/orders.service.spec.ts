import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersService } from './orders.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

const mockProduct = { id: 'prod-1', stock: 10 };
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

const makeDb = () => ({
  query: {
    orders:                 { findFirst: vi.fn().mockResolvedValue(mockOrder), findMany: vi.fn().mockResolvedValue([mockOrder]) },
    orderItems:             { findFirst: vi.fn() },
    reviews:                { findFirst: vi.fn().mockResolvedValue(null) },
    coupons:                { findFirst: vi.fn().mockResolvedValue(null) },
    inventoryReservations:  { findMany: vi.fn().mockResolvedValue([]) },
    marketplaceConfig:      { findFirst: vi.fn().mockResolvedValue({ commissionGlobalRate: '0.10' }) },
  },
  select: vi.fn().mockReturnThis(),
  from:   vi.fn().mockReturnThis(),
  where:  vi.fn().mockResolvedValue([{ count: 1 }]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([mockOrder]),
  update: vi.fn().mockReturnThis(),
  set:    vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
});

const makeCartService = (overrides = {}) => ({
  getCart:              vi.fn().mockResolvedValue({ data: mockCart }),
  getAvailableStock:    vi.fn().mockResolvedValue(10),
  ...overrides,
});

describe('OrdersService', () => {
  let service: OrdersService;
  let db: ReturnType<typeof makeDb>;
  let cartService: ReturnType<typeof makeCartService>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeDb();
    cartService = makeCartService();
    service = new OrdersService(db as any, cartService as any);
  });

  it('createOrder throws BadRequestException when cart is empty', async () => {
    cartService.getCart.mockResolvedValueOnce({ data: { ...mockCart, items: [] } });
    await expect(service.createOrder('user-1', {})).rejects.toThrow(BadRequestException);
  });

  it('getOrders returns paginated list', async () => {
    const result = await service.getOrders('user-1');
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('getOrder throws ForbiddenException for wrong user', async () => {
    await expect(service.getOrder('order-1', 'other-user')).rejects.toThrow(ForbiddenException);
  });

  it('cancelOrder throws BadRequestException if order not pending', async () => {
    db.query.orders.findFirst.mockResolvedValueOnce({ ...mockOrder, status: 'paid' });
    await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('isReviewEligible returns eligible: false when order not delivered', async () => {
    const result = await service.isReviewEligible('order-1', 'item-1', 'user-1');
    expect(result.data.eligible).toBe(false);
  });
});
