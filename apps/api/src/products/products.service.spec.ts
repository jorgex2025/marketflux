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

const makeDb = () => {
  let limitResult: any = [mockProduct];
  
  const chain: any = {};
  
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.limit = vi.fn(() => Promise.resolve(limitResult));
  chain.offset = vi.fn(() => Promise.resolve([]));
  chain.insert = vi.fn(() => chain);
  chain.values = vi.fn(() => chain);
  chain.returning = vi.fn(() => Promise.resolve([mockProduct]));
  chain.update = vi.fn(() => chain);
  chain.set = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  
  const db: any = {
    select: vi.fn(() => chain),
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(limitResult)),
    offset: vi.fn(() => Promise.resolve([])),
    insert: vi.fn(() => chain),
    values: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([mockProduct])),
    update: vi.fn(() => chain),
    set: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    _setLimitResult: (result: any) => { limitResult = result; },
  };
  
  return db;
};

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
    db._setLimitResult([]);
    await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('remove calls search.delete', async () => {
    const mockProductWithAll = {
      ...mockProduct,
      description: null,
      comparePrice: null,
      sku: null,
      weight: null,
    };
    db._setLimitResult([mockProductWithAll]);
    await service.remove('prod-1');
    expect(mockSearch.delete).toHaveBeenCalledWith('prod-1');
  });

  it('update throws ForbiddenException for wrong seller', async () => {
    db._setLimitResult([mockProduct]);
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

  describe('IDOR Prevention', () => {
    it('vendedor A no puede editar producto de vendedor B', async () => {
      const otherSellerProduct = { ...mockProduct, sellerId: 'other-seller' };
      db._setLimitResult([otherSellerProduct]);
      await expect(
        service.update('prod-1', { name: 'Hacked' }, 'seller-a', 'seller'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('usuario no puede eliminar producto que no existe', async () => {
      db._setLimitResult([]);
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Input Validation', () => {
    it('previene SQL injection en búsqueda por slug', async () => {
      const maliciousSlug = "'; DROP TABLE products; --";
      db._setLimitResult([]);
      await expect(service.findBySlug(maliciousSlug)).rejects.toThrow(NotFoundException);
    });

    it('rechaza producto con precio negativo', async () => {
      db._setLimitResult([]);
      await expect(
        service.create(
          { name: 'Test', price: '-99.99', stock: 10 } as any,
          'seller-1',
        ),
      ).rejects.toThrow();
    });
  });

  describe('Mass Assignment Prevention', () => {
    it('no permite cambiar sellerId al actualizar producto', async () => {
      db._setLimitResult([mockProduct]);
      await expect(
        service.update(
          'prod-1',
          { name: 'Updated', sellerId: 'hacked-seller' } as any,
          'user-seller',
          'seller',
        ),
      ).rejects.toThrow();
    });
  });
});
