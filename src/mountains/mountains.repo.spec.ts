import { Test, TestingModule } from '@nestjs/testing';
import { MountainsRepository } from './mountains.repo.js';
import { DATABASE } from '../db/database.provider.js';

describe('MountainsRepository', () => {
  let repo: MountainsRepository;
  const mockResult = [{ id: 'm1' }];
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  function chainableSelect() {
    return {
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(mockResult),
        where: vi.fn().mockResolvedValue(mockResult),
      }),
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MountainsRepository,
        { provide: DATABASE, useValue: mockDb },
      ],
    }).compile();

    repo = module.get<MountainsRepository>(MountainsRepository);
  });

  it('should be defined', () => {
    expect(repo).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the ordered rows', async () => {
      mockDb.select.mockReturnValue(chainableSelect());

      await expect(repo.findAll()).resolves.toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('returns the first row', async () => {
      mockDb.select.mockReturnValue(chainableSelect());

      await expect(repo.findOne('m1')).resolves.toEqual(mockResult[0]);
    });

    it('returns null when no row matches', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await expect(repo.findOne('missing')).resolves.toBeNull();
    });
  });

  describe('create', () => {
    it('returns the inserted row', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResult),
        }),
      });

      await expect(
        repo.create({ name: 'Fansipan' } as never),
      ).resolves.toEqual(mockResult[0]);
    });
  });

  describe('update', () => {
    it('returns the updated row', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(mockResult),
          }),
        }),
      });

      await expect(
        repo.update('m1', { name: 'Renamed' } as never),
      ).resolves.toEqual(mockResult[0]);
    });

    it('returns null when nothing was updated', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        repo.update('missing', { name: 'Renamed' } as never),
      ).resolves.toBeNull();
    });
  });

  describe('remove', () => {
    it('returns the deleted row', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResult),
        }),
      });

      await expect(repo.remove('m1')).resolves.toEqual(mockResult[0]);
    });
  });
});