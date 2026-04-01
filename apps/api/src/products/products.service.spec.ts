import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsService } from './products.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockSearch = {
  search: vi.fn(),
  upsert: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
};

const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  slug: 'test-product',
  price: '99.99',
  stock: 10,
  status: 'active',
  storeId: 'store-1',
  sellerId: 'user-seller',
  categoryId: null,
  featured: false,
  tags: [],
  images: [],
  description: null,
  comparePrice: null,
  sku: null,
  weight: null,
  attributes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeDb = (overrides: Record<string, unknown> = {}) => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([mockProduct]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([mockProduct]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  and: vi.fn(),
  ...overrides,
});

describe('ProductsService', () => {
  let service: ProductsService;
  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = makeDb();
    service = new ProductsService(
      db as unknown as Parameters<typeof ProductsService.prototype.constructor>[0],
      mockSearch as unknown as Parameters<typeof ProductsService.prototype.constructor>[1],
    );
  });

  it('findBySlug throws NotFoundException when not found', async () => {
    db.limit.mockResolvedValueOnce([]);
    await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('remove calls search.delete', async () => {
    db.limit.mockResolvedValueOnce([mockProduct]);
    db.delete.mockReturnThis();
    db.where = vi.fn().mockResolvedValue(undefined);
    await service.remove('prod-1');
    expect(mockSearch.delete).toHaveBeenCalledWith('prod-1');
  });

  it('update throws ForbiddenException for wrong seller', async () => {
    db.limit.mockResolvedValueOnce([mockProduct]);
    await expect(
      service.update('prod-1', { name: 'X' }, 'other-user', 'seller'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('startBulkJob returns a jobId', () => {
    const jobId = service.startBulkJob([{ name: 'A' }, { name: 'B' }]);
    expect(typeof jobId).toBe('string');
    const status = service.getBulkStatus(jobId);
    expect(status.total).toBe(2);
  });
});
