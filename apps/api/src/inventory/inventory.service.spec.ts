import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

const mockDrizzleService = {
  db: {
    query: {
      products: { findFirst: vi.fn() },
      stores: { findFirst: vi.fn() },
    },
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService(mockDrizzleService as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException when product not found on updateProductStock', async () => {
    mockDrizzleService.db.query.products.findFirst.mockResolvedValue(null);
    await expect(service.updateProductStock('uuid-fake', { stock: 10 }, 'seller-1')).rejects.toThrow('Product not found');
  });

  it('throws ForbiddenException when product does not belong to seller', async () => {
    mockDrizzleService.db.query.products.findFirst.mockResolvedValue({ id: 'p1', storeId: 'store-1', stock: 5 });
    mockDrizzleService.db.query.stores.findFirst.mockResolvedValue(null);
    await expect(service.updateProductStock('p1', { stock: 10 }, 'seller-other')).rejects.toThrow('Not your product');
  });
});
