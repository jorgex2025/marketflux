import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CouponsService } from './coupons.service';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'coupon-1' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
};

describe('CouponsService', () => {
  let service: CouponsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CouponsService(mockDrizzleService as any);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });
});
