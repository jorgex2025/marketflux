import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { DATABASE_TOKEN } from '../database/database.module';

const mockDb = {
  query: {
    products: { findFirst: vi.fn() },
    stores: { findFirst: vi.fn() },
  },
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: DATABASE_TOKEN, useValue: mockDb },
      ],
    }).compile();
    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException when product not found on updateProductStock', async () => {
    mockDb.query.products.findFirst.mockResolvedValue(null);
    await expect(service.updateProductStock('uuid-fake', { stock: 10 }, 'seller-1')).rejects.toThrow('Product not found');
  });

  it('throws ForbiddenException when product does not belong to seller', async () => {
    mockDb.query.products.findFirst.mockResolvedValue({ id: 'p1', storeId: 'store-1', stock: 5 });
    mockDb.query.stores.findFirst.mockResolvedValue(null);
    await expect(service.updateProductStock('p1', { stock: 10 }, 'seller-other')).rejects.toThrow('Not your product');
  });
});
