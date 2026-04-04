import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
import { DrizzleService } from '../database/drizzle.service';

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

describe('DisputesService', () => {
  let service: DisputesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        { provide: DrizzleService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('throws NotFoundException when order not found or not buyer\'s', async () => {
      const spy = jest.spyOn(service['db'].client, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([]) }),
      } as unknown as ReturnType<typeof mockDb.client.select>);
      await expect(
        service.create({ orderId: 'o-none', reason: 'r', description: 'd' }, 'buyer1'),
      ).rejects.toThrow(NotFoundException);
      spy.mockRestore();
    });
  });

  describe('resolve', () => {
    it('throws BadRequestException when dispute already resolved', async () => {
      const spy = jest.spyOn(service['db'].client, 'select').mockReturnValue({
        from: () => ({ where: () => Promise.resolve([{ id: 'd1', status: 'resolved_buyer' }]) }),
      } as unknown as ReturnType<typeof mockDb.client.select>);
      await expect(
        service.resolve('d1', { status: 'closed', resolution: 'ignore' }),
      ).rejects.toThrow(BadRequestException);
      spy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('throws ForbiddenException for unrelated user', async () => {
      const spy = jest.spyOn(service['db'].client, 'select').mockReturnValue({
        from: () => ({
          where: () =>
            Promise.resolve([{ id: 'd1', buyerId: 'buyer-other', sellerId: 'seller-other', status: 'open' }]),
        }),
      } as unknown as ReturnType<typeof mockDb.client.select>);
      await expect(service.findOne('d1', 'random-user', 'buyer')).rejects.toThrow(ForbiddenException);
      spy.mockRestore();
    });
  });
});
