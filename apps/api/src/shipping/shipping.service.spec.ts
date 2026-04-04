import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShippingService } from './shipping.service';
import { DrizzleService } from '../database/database.module';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

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

describe('ShippingService', () => {
  let service: ShippingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ShippingService(mockDb as unknown as DrizzleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createZone', () => {
    it('creates and returns a shipping zone', async () => {
      const zone = { id: 'z1', name: 'America Latina', countries: ['CO', 'MX'] };
      mockDb.db.returning.mockResolvedValueOnce([zone]);
      const result = await service.createZone({ name: 'America Latina', countries: ['CO', 'MX'] });
      expect(result.data).toEqual(zone);
    });
  });

  describe('trackShipment', () => {
    it('throws NotFoundException when tracking number not found', async () => {
      const spy = vi.spyOn(service['db'].db, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([]) }),
      } as unknown as ReturnType<typeof mockDb.db.select>);
      await expect(service.trackShipment('NOTEXIST')).rejects.toThrow(NotFoundException);
      spy.mockRestore();
    });
  });

  describe('updateShipment', () => {
    it('throws ForbiddenException when seller tries to update another seller shipment', async () => {
      const spy = vi.spyOn(service['db'].db, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([{ id: 's1', sellerId: 'seller-other' }]) }),
      } as unknown as ReturnType<typeof mockDb.db.select>);
      await expect(
        service.updateShipment('s1', {}, 'seller-mine', 'seller'),
      ).rejects.toThrow(ForbiddenException);
      spy.mockRestore();
    });
  });
});
