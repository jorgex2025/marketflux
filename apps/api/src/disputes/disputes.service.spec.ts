import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisputesService } from './disputes.service';
import { DrizzleService } from '../database/database.module';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

const mockDb = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  },
};

describe('DisputesService', () => {
  let service: DisputesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DisputesService(mockDb as unknown as DrizzleService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('throws NotFoundException when order not found or not buyer\'s', async () => {
      const spy = vi.spyOn(service['db'].db, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([]) }),
      } as unknown as ReturnType<typeof mockDb.db.select>);
      await expect(
        service.create({ orderId: 'o-none', reason: 'r', description: 'd' }, 'buyer1'),
      ).rejects.toThrow(NotFoundException);
      spy.mockRestore();
    });
  });

  describe('resolve', () => {
    it('throws BadRequestException when dispute already resolved', async () => {
      const spy = vi.spyOn(service['db'].db, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([{ id: 'd1', status: 'resolved_buyer' }]) }),
      } as unknown as ReturnType<typeof mockDb.db.select>);
      await expect(
        service.resolve('d1', { status: 'closed', resolution: 'ignore' }),
      ).rejects.toThrow(BadRequestException);
      spy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('throws ForbiddenException for unrelated user', async () => {
      const spy = vi.spyOn(service['db'].db, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([{ id: 'd1', buyerId: 'buyer-other', sellerId: 'seller-other', status: 'open' }]) }),
      } as unknown as ReturnType<typeof mockDb.db.select>);
      await expect(service.findOne('d1', 'random-user', 'buyer')).rejects.toThrow(ForbiddenException);
      spy.mockRestore();
    });
  });
});
