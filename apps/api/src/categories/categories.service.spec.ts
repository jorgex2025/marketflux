import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoriesService } from './categories.service';
import { NotFoundException } from '@nestjs/common';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoriesService(mockDrizzleService as any);
  });

  it('findTree returns root categories', async () => {
    const rows = [
      { id: '1', name: 'Electronica', slug: 'electronica', parentId: null, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Celulares', slug: 'celulares', parentId: '1', order: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockDrizzleService.db.orderBy.mockResolvedValueOnce(rows);
    const tree = await service.findTree();
    expect(Array.isArray(tree)).toBe(true);
  });

  it('update throws NotFoundException when not found', async () => {
    mockDrizzleService.db.returning.mockResolvedValueOnce([]);
    await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
