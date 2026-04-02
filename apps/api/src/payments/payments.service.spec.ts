import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_TOKEN } from '../database/drizzle.decorator';

const mockDb = {
  query: {
    orders: {
      findFirst: jest.fn(),
    },
  },
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
  execute: jest.fn().mockResolvedValue([]),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_mock',
      STRIPE_WEBHOOK_SECRET: 'whsec_mock',
      WEB_URL: 'http://localhost:3000',
    };
    return map[key] ?? '';
  }),
  get: jest.fn((key: string) => {
    return key === 'WEB_URL' ? 'http://localhost:3000' : undefined;
  }),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: DRIZZLE_TOKEN, useValue: mockDb },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('lanza NotFoundException si la orden no existe', async () => {
      mockDb.query.orders.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.createCheckoutSession({ orderId: 'non-existent-id' }, 'user-1'),
      ).rejects.toThrow('Orden no encontrada');
    });

    it('lanza BadRequestException si la orden no pertenece al usuario', async () => {
      mockDb.query.orders.findFirst.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'other-user',
        status: 'pending',
        items: [],
      });
      await expect(
        service.createCheckoutSession({ orderId: 'order-1' }, 'user-1'),
      ).rejects.toThrow('No autorizado');
    });

    it('lanza BadRequestException si la orden no está en estado pending', async () => {
      mockDb.query.orders.findFirst.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'user-1',
        status: 'confirmed',
        items: [],
      });
      await expect(
        service.createCheckoutSession({ orderId: 'order-1' }, 'user-1'),
      ).rejects.toThrow('La orden no está en estado pendiente');
    });
  });
});
