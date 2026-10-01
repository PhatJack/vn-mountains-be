import { Test, TestingModule } from '@nestjs/testing';
import { MountainsService } from './mountains.service.js';
import { MountainsRepository } from './mountains.repo.js';
import { R2Service } from '../r2/r2.service.js';

describe('MountainsService', () => {
  let service: MountainsService;
  const mockRepo = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  const mockR2 = { deletePrefix: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MountainsService,
        { provide: MountainsRepository, useValue: mockRepo },
        { provide: R2Service, useValue: mockR2 },
      ],
    }).compile();

    service = module.get<MountainsService>(MountainsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('maps rows to the public list shape and drops missing osm_id', async () => {
      mockRepo.findAll.mockResolvedValue([
        {
          osmId: 111,
          name: 'Fansipan',
          elevation: 3147.3,
          latitude: 22.303,
          longitude: 103.775,
        },
        {
          osmId: null,
          name: 'NoOsmId',
          elevation: 100,
          latitude: 10,
          longitude: 105,
        },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: 111,
          name: 'Fansipan',
          elevation: 3147.3,
          lat: 22.303,
          lng: 103.775,
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the mountain is missing', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        'Mountain #missing not found',
      );
    });

    it('returns the row when found', async () => {
      const row = { id: 'abc', name: 'Fansipan' };
      mockRepo.findOne.mockResolvedValue(row);

      await expect(service.findOne('abc')).resolves.toBe(row);
    });
  });
});
