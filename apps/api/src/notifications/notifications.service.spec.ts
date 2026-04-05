import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service';
import { NotFoundException } from '@nestjs/common';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'notif-1' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationsService(mockDrizzleService as any);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería tener método setGateway', () => {
    expect(service.setGateway).toBeDefined();
    expect(typeof service.setGateway).toBe('function');
  });

  it('notify should insert notification and emit via gateway', async () => {
    const mockGateway = { emitToUser: vi.fn() };
    service.setGateway(mockGateway);

    const result = await service.notify({
      userId: 'user-1',
      type: 'order_paid',
      title: 'Order Paid',
      body: 'Your order was paid',
    });

    expect(result).toEqual({ id: 'notif-1' });
    expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 'notification', { id: 'notif-1' });
  });

  it('notify should work without gateway (logs warning)', async () => {
    const result = await service.notify({
      userId: 'user-1',
      type: 'order_paid',
      title: 'Order Paid',
    });

    expect(result).toEqual({ id: 'notif-1' });
  });

  it('getUnread should return unread notifications', async () => {
    const unread = [{ id: 'notif-1', title: 'Test', readAt: null }];
    mockDrizzleService.db.orderBy.mockResolvedValueOnce(unread);

    const result = await service.getUnread('user-1');

    expect(result).toEqual(unread);
  });

  it('getAll should return paginated notifications', async () => {
    const all = [{ id: 'notif-1', title: 'Test' }];
    mockDrizzleService.db.offset.mockResolvedValueOnce(all);

    const result = await service.getAll('user-1', 1, 10);

    expect(result).toEqual(all);
  });

  it('markRead should mark notification as read', async () => {
    mockDrizzleService.db.limit.mockResolvedValueOnce([{ id: 'notif-1' }]);

    const result = await service.markRead('notif-1', 'user-1');

    expect(mockDrizzleService.db.update).toHaveBeenCalled();
    expect(result).toEqual({ id: 'notif-1' });
  });

  it('markRead should throw NotFoundException if not found', async () => {
    mockDrizzleService.db.limit.mockResolvedValueOnce([]);

    await expect(service.markRead('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('markAllRead should mark all as read', async () => {
    const result = await service.markAllRead('user-1');

    expect(mockDrizzleService.db.update).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
