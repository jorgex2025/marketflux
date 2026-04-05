import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketplaceConfigService } from './config.service';
import { NotFoundException } from '@nestjs/common';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  },
};

describe('MarketplaceConfigService', () => {
  let service: MarketplaceConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MarketplaceConfigService(mockDrizzleService as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getAll should return config as key-value map', async () => {
    const rows = [
      { key: 'commission_rate', value: '0.10' },
      { key: 'maintenance_mode', value: 'false' },
    ];
    mockDrizzleService.db.from.mockResolvedValueOnce(rows);

    const result = await service.getAll();

    expect(result).toEqual({ commission_rate: '0.10', maintenance_mode: 'false' });
  });

  it('get should return value for existing key', async () => {
    mockDrizzleService.db.limit.mockResolvedValueOnce([{ key: 'test_key', value: 'test_value' }]);

    const result = await service.get('test_key');

    expect(result).toBe('test_value');
  });

  it('get should throw NotFoundException for missing key', async () => {
    mockDrizzleService.db.limit.mockResolvedValueOnce([]);

    await expect(service.get('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('set should insert or update config', async () => {
    await service.set('new_key', 'new_value');

    expect(mockDrizzleService.db.insert).toHaveBeenCalled();
    expect(mockDrizzleService.db.onConflictDoUpdate).toHaveBeenCalled();
  });

  it('setBulk should set multiple entries', async () => {
    await service.setBulk([
      { key: 'key1', value: 'val1' },
      { key: 'key2', value: 'val2' },
    ]);

    expect(mockDrizzleService.db.insert).toHaveBeenCalledTimes(2);
  });
});
