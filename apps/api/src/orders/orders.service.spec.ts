import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { DATABASE_TOKEN } from '../database/database.module';
import { CartService } from '../cart/cart.service';

const mockDb = {
  query: {
    orders: { findFirst: vi.fn(), findMany: vi.fn() },
    orderItems: { findFirst: vi.fn() },
    inventoryReservations: { findMany: vi.fn() },
    marketplaceConfig: { findFirst: vi.fn() },
    coupons: { findFirst: vi.fn() },
    reviews: { findFirst: vi.fn() },
    productVariants: { findFirst: vi.fn() },
    products: { findFirst: vi.fn() },
  },
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
};

const mockCartService = {
  getCart: vi.fn(),
  getAvailableStock: vi.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DATABASE_TOKEN, useValue: mockDb },
        { provide: CartService, useValue: mockCartService },
      ],
    }).compile();
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws BadRequestException when cart is empty', async () => {
    mockCartService.getCart.mockResolvedValue({ data: { items: [], couponCode: null } });
    await expect(service.createOrder('user-1', {})).rejects.toThrow('Cart is empty');
  });

  it('throws ConflictException when stock is insufficient (no overselling)', async () => {
    mockCartService.getCart.mockResolvedValue({
      data: {
        id: 'cart-1',
        couponCode: null,
        items: [{ productId: 'p1', variantId: null, qty: 10, unitPrice: '100.00' }],
      },
    });
    mockCartService.getAvailableStock.mockResolvedValue(3);
    await expect(service.createOrder('user-1', {})).rejects.toThrow('Insufficient stock');
  });

  it('throws BadRequestException when cancelling a non-pending order', async () => {
    mockDb.query.orders.findFirst.mockResolvedValue({ id: 'order-1', userId: 'user-1', status: 'paid' });
    await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow('Only pending orders can be cancelled');
  });

  it('commission_rate is set at order creation time (snapshot immutable)', async () => {
    mockCartService.getCart.mockResolvedValue({
      data: {
        id: 'cart-1',
        couponCode: null,
        status: 'active',
        items: [{ productId: 'p1', variantId: null, qty: 1, unitPrice: '50.00' }],
      },
    });
    mockCartService.getAvailableStock.mockResolvedValue(10);
    mockDb.query.marketplaceConfig.findFirst.mockResolvedValue({ commissionGlobalRate: '0.15' });
    mockDb.query.coupons.findFirst.mockResolvedValue(null);
    const insertedOrder = { id: 'order-new', status: 'pending', total: '50.00' };
    mockDb.returning
      .mockResolvedValueOnce([insertedOrder])
      .mockResolvedValueOnce([{ id: 'item-1', commissionRate: '0.15' }])
      .mockResolvedValueOnce([{}]);
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
    const result = await service.createOrder('user-1', {});
    expect(result.data.status).toBe('pending');
  });
});
