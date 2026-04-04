import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReturnsService } from './returns.service';
import { DrizzleService } from '../database/database.module';
import { ForbiddenException } from '@nestjs/common';

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      refunds: { create: vi.fn() },
    })),
  };
});

const createMockDb = () => {
  let queryResult: any = [];
  let innerJoinResult: any = [];
  
  const chain: any = {
    from: vi.fn(function(this: any) { return this; }),
    where: vi.fn(function() { return Promise.resolve(queryResult); }),
    innerJoin: vi.fn(function(this: any) { return this; }),
    insert: vi.fn(function(this: any) { return this; }),
    values: vi.fn(function(this: any) { return this; }),
    returning: vi.fn(() => Promise.resolve([])),
    update: vi.fn(function(this: any) { return this; }),
    set: vi.fn(function(this: any) { return this; }),
  };
  
  chain.innerJoin = vi.fn(() => {
    chain.where = vi.fn(() => Promise.resolve(innerJoinResult));
    return chain;
  });
  
  const db: any = {
    select: vi.fn(() => chain),
    from: vi.fn(() => chain),
    where: vi.fn(() => Promise.resolve(queryResult)),
    innerJoin: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    values: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([])),
    update: vi.fn(() => chain),
    set: vi.fn(() => chain),
    _setQueryResult: (result: any) => { queryResult = result; },
    _setInnerJoinResult: (result: any) => { innerJoinResult = result; },
  };
  
  const updateChain: any = {
    set: vi.fn(() => updateChain),
    where: vi.fn(() => updateChain),
    returning: vi.fn(() => Promise.resolve([])),
  };
  db.update = vi.fn(() => updateChain);
  
  return { db };
};

const mockDb = createMockDb();

describe('ReturnsService', () => {
  let service: ReturnsService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    service = new ReturnsService(mockDb as unknown as DrizzleService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('Security Tests', () => {
    it('valida permisos antes de aprobar return', async () => {
      mockDb.db._setQueryResult([{ id: 'r1', sellerId: 'other-seller' }]);
      mockDb.db._setInnerJoinResult([]);
      await expect(service.approve('r1', 'my-seller', 'seller')).rejects.toThrow();
    });
  });
});
