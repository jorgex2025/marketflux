import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockDb = {
  client: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  },
};

describe('ShippingService', () => {
  let service: ShippingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();
    service = module.get<ShippingService>(ShippingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createZone', () => {
    it('creates and returns a shipping zone', async () => {
      const zone = { id: 'z1', name: 'America Latina', countries: ['CO', 'MX'] };
      mockDb.client.returning.mockResolvedValueOnce([zone]);
      const result = await service.createZone({ name: 'America Latina', countries: ['CO', 'MX'] });
      expect(result.data).toEqual(zone);
    });
  });

  describe('trackShipment', () => {
    it('throws NotFoundException when tracking number not found', async () => {
      mockDb.client.returning = jest.fn();
      // simulate empty result from select chain
      const spy = jest.spyOn(service['db'].client, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([]) }),
      } as unknown as ReturnType<typeof mockDb.client.select>);
      await expect(service.trackShipment('NOTEXIST')).rejects.toThrow(NotFoundException);
      spy.mockRestore();
    });
  });

  describe('updateShipment', () => {
    it('throws ForbiddenException when seller tries to update another seller shipment', async () => {
      const spy = jest.spyOn(service['db'].client, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([{ id: 's1', sellerId: 'seller-other' }]) }),
      } as unknown as ReturnType<typeof mockDb.client.select>);
      await expect(
        service.updateShipment('s1', {}, 'seller-mine', 'seller'),
      ).rejects.toThrow(ForbiddenException);
      spy.mockRestore();
    });
  });
});
