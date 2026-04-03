import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsService } from './payments.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: 'pending',
  total: '99.99',
  discount: '0',
  items: [{ quantity: 1, unitPrice: '99.99', product: { name: 'Test' }, productId: 'prod-1' }],
  stripeSessionId: null,
};

const mockDb = {
  query: {
    orders: { findFirst: vi.fn().mockResolvedValue(mockOrder) },
    payments: { findFirst: vi.fn() },
  },
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{}]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  getOrThrow: vi.fn((key: string) => {
    const map: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_fake',
      STRIPE_WEBHOOK_SECRET: 'whsec_fake',
      WEB_URL: 'http://localhost:3000',
    };
    return map[key] ?? '';
  }),
  get: vi.fn((key: string) => key === 'WEB_URL' ? 'http://localhost:3000' : undefined),
};

const mockStripeSession = { id: 'sess_test', url: 'https://checkout.stripe.com/test' };

const mockStripe = {
  checkout: { sessions: { create: vi.fn().mockResolvedValue(mockStripeSession) } },
  coupons: { create: vi.fn().mockResolvedValue({ id: 'coup_test' }) },
  webhooks: { constructEvent: vi.fn() },
};

const mockOrdersService = {
  confirmOrderPayment: vi.fn().mockResolvedValue(undefined),
  cancelOrder: vi.fn().mockResolvedValue(undefined),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentsService(
      mockDb as any,
      mockConfig as any,
      mockOrdersService as any,
    );
    // Patch stripe instance
    (service as any).stripe = mockStripe;
  });

  it('createCheckoutSession returns { url }', async () => {
    const result = await service.createCheckoutSession(
      { orderId: 'order-1' },
      'user-1',
    );
    expect(result.url).toBe(mockStripeSession.url);
  });

  it('createCheckoutSession throws NotFoundException for unknown order', async () => {
    mockDb.query.orders.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.createCheckoutSession({ orderId: 'bad' }, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('createCheckoutSession throws BadRequestException for wrong user', async () => {
    await expect(
      service.createCheckoutSession({ orderId: 'order-1' }, 'other-user'),
    ).rejects.toThrow(BadRequestException);
  });

  it('createCheckoutSession throws BadRequestException for non-pending order', async () => {
    mockDb.query.orders.findFirst.mockResolvedValueOnce({ ...mockOrder, status: 'paid' });
    await expect(
      service.createCheckoutSession({ orderId: 'order-1' }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
