import { Test, TestingModule } from '@nestjs/testing';
import { ReputationProcessor } from './reputation.processor';
import { ReputationService } from './reputation.service';
import { DrizzleService } from '../database/drizzle.service';
import { Logger } from '@nestjs/common';

const mockReputationService = { recalculate: jest.fn() };
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([{ storeId: 'store-1' }]),
};

describe('ReputationProcessor', () => {
  let processor: ReputationProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationProcessor,
        { provide: ReputationService, useValue: mockReputationService },
        { provide: DrizzleService, useValue: { db: mockDb } },
      ],
    }).compile();

    processor = module.get<ReputationProcessor>(ReputationProcessor);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should call recalculate when sellerId is provided', async () => {
    await processor.process({ data: { productId: 'prod-1', sellerId: 'seller-1' } } as never);
    expect(mockReputationService.recalculate).toHaveBeenCalledWith('seller-1');
  });

  it('should warn if product not found and no sellerId', async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    await processor.process({ data: { productId: 'prod-1' } } as never);
    expect(mockReputationService.recalculate).not.toHaveBeenCalled();
  });
});
