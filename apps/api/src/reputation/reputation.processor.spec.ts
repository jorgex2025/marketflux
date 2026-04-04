import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReputationProcessor } from './reputation.processor';
import { ReputationService } from './reputation.service';
import { DrizzleService } from '../database/database.module';
import { Logger } from '@nestjs/common';

const mockReputationService = { recalculate: vi.fn() };
const mockDb = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ storeId: 'store-1' }]),
  },
};

describe('ReputationProcessor', () => {
  let processor: ReputationProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new ReputationProcessor(
      mockReputationService as unknown as ReputationService,
      mockDb as unknown as DrizzleService,
    );
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should call recalculate when sellerId is provided', async () => {
    await processor.process({ data: { productId: 'prod-1', sellerId: 'seller-1' } } as never);
    expect(mockReputationService.recalculate).toHaveBeenCalledWith('seller-1');
  });

  it('should warn if product not found and no sellerId', async () => {
    mockDb.db.limit.mockResolvedValueOnce([]);
    await processor.process({ data: { productId: 'prod-1' } } as never);
    expect(mockReputationService.recalculate).not.toHaveBeenCalled();
  });
});
