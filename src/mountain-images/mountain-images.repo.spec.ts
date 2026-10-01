import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE } from '../db/database.provider.js';
import { MountainImagesRepository } from './mountain-images.repo.js';

describe('MountainImagesRepository', () => {
  let repo: MountainImagesRepository;
  const db = { select: vi.fn(), insert: vi.fn(), delete: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MountainImagesRepository, { provide: DATABASE, useValue: db }],
    }).compile();
    repo = module.get(MountainImagesRepository);
  });

  it('returns images for a mountain', async () => {
    const rows = [{ id: 'image-id', mountainId: 'mountain-id' }];
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }),
    });

    await expect(repo.findByMountainId('mountain-id')).resolves.toEqual(rows);
  });

  it('inserts an image row', async () => {
    const row = { id: 'image-id' };
    db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([row]) }),
    });

    await expect(repo.create({} as never)).resolves.toEqual(row);
  });
});
