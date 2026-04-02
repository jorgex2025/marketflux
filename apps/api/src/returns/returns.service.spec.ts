import { Test, TestingModule } from '@nestjs/testing';
import { ReturnsService } from './returns.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

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

describe('ReturnsService', () => {
  let service: ReturnsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();
    service = module.get<ReturnsService>(ReturnsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('throws BadRequestException when order not delivered', async () => {
      const selectSpy = jest.spyOn(service['db'].client, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([{ id: 'o1', userId: 'u1', status: 'paid' }]) }),
      } as unknown as ReturnType<typeof mockDb.client.select>);
      await expect(
        service.create({ orderId: 'o1', reason: 'defective', description: 'broken screen' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
      selectSpy.mockRestore();
    });

    it('throws NotFoundException when order not found', async () => {
      const selectSpy = jest.spyOn(service['db'].client, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([]) }),
      } as unknown as ReturnType<typeof mockDb.client.select>);
      await expect(
        service.create({ orderId: 'o-not', reason: 'r', description: 'd' }, 'u1'),
      ).rejects.toThrow(NotFoundException);
      selectSpy.mockRestore();
    });
  });

  describe('approve', () => {
    it('throws ForbiddenException for wrong seller', async () => {
      const selectSpy = jest.spyOn(service['db'].client, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([{ id: 'r1', sellerId: 'other-seller' }]) }),
      } as unknown as ReturnType<typeof mockDb.client.select>);
      await expect(service.approve('r1', 'my-seller', 'seller')).rejects.toThrow(ForbiddenException);
      selectSpy.mockRestore();
    });
  });
});
