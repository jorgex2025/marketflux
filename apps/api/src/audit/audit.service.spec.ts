import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from './audit.service';

const mockDrizzleService = {
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
  },
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuditService(mockDrizzleService as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('log should insert audit log entry', async () => {
    const entry = {
      userId: 'user-1',
      action: 'POST',
      entity: 'products',
      entityId: 'prod-1',
      metadata: { body: { name: 'Test' } },
      ipAddress: '127.0.0.1',
    };

    await service.log(entry);

    expect(mockDrizzleService.db.insert).toHaveBeenCalled();
    expect(mockDrizzleService.db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'POST',
        entity: 'products',
        entityId: 'prod-1',
        ipAddress: '127.0.0.1',
      }),
    );
  });

  it('findAll should return audit logs', async () => {
    const logs = [
      { id: '1', userId: 'user-1', action: 'POST', entity: 'products', createdAt: new Date() },
    ];
    mockDrizzleService.db.offset.mockResolvedValueOnce(logs);

    const result = await service.findAll({ userId: 'user-1', page: 1, limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it('findAll without filters should return all logs', async () => {
    mockDrizzleService.db.offset.mockResolvedValueOnce([]);

    const result = await service.findAll();

    expect(Array.isArray(result)).toBe(true);
  });
});
