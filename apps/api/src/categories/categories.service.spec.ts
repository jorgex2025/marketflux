import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoriesService } from './categories.service';
import { NotFoundException } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module';

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoriesService(mockDb as unknown as Parameters<typeof CategoriesService.prototype.constructor>[0]);
  });

  it('findTree returns root categories', async () => {
    const rows = [
      { id: '1', name: 'Electronica', parentId: null, children: [] },
      { id: '2', name: 'Celulares', parentId: '1', children: [] },
    ];
    mockDb.orderBy.mockResolvedValueOnce(rows);
    const tree = await service.findTree();
    expect(Array.isArray(tree)).toBe(true);
  });

  it('update throws NotFoundException when not found', async () => {
    mockDb.returning.mockResolvedValueOnce([]);
    await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
