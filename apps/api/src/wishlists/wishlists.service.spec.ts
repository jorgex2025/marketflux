import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WishlistsService } from './wishlists.service';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'wishlist-1' }]),
    delete: vi.fn().mockReturnThis(),
  },
};

describe('WishlistsService', () => {
  let service: WishlistsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WishlistsService(mockDrizzleService as any);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });
});
