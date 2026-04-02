import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { DrizzleService } from '../database/drizzle.service';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
};

const mockQueue = { add: jest.fn() };

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: DrizzleService,
          useValue: { db: mockDb },
        },
        {
          provide: getQueueToken('reputation'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if no delivered order', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      await expect(
        service.create('user-1', {
          productId: 'prod-1',
          rating: 5,
          title: 'Test',
          body: 'Test body',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('toggleHelpful', () => {
    it('should add helpful if not exists', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      mockDb.values.mockResolvedValueOnce([]);
      const result = await service.toggleHelpful('user-1', 'review-1');
      expect(result.data.helpful).toBe(true);
    });

    it('should remove helpful if exists', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: '1' }]);
      mockDb.where.mockResolvedValueOnce([]);
      const result = await service.toggleHelpful('user-1', 'review-1');
      expect(result.data.helpful).toBe(false);
    });
  });
});
