import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VendorsService } from './vendors.service';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  },
};

describe('VendorsService', () => {
  let service: VendorsService;

  beforeEach(() => {
    service = new VendorsService(mockDrizzleService as any);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });
});
