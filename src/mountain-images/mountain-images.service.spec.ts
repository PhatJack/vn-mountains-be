import { Test, TestingModule } from '@nestjs/testing';
import { MountainImagesService } from './mountain-images.service.js';
import { MountainImagesRepository } from './mountain-images.repo.js';
import { MountainsRepository } from '../mountains/mountains.repo.js';
import { R2Service } from '../r2/r2.service.js';

describe('MountainImagesService', () => {
  let service: MountainImagesService;
  const imagesRepo = {
    create: vi.fn(),
    findByMountainId: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
  };
  const mountainsRepo = { findOne: vi.fn() };
  const r2 = {
    uploadBuffer: vi.fn(),
    deleteObject: vi.fn(),
    deleteByUrl: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MountainImagesService,
        { provide: MountainImagesRepository, useValue: imagesRepo },
        { provide: MountainsRepository, useValue: mountainsRepo },
        { provide: R2Service, useValue: r2 },
      ],
    }).compile();

    service = module.get<MountainImagesService>(MountainImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uploads to the mountain folder and stores the public URL', async () => {
    const mountainId = '550e8400-e29b-41d4-a716-446655440000';
    const file = { mimetype: 'image/png', buffer: Buffer.from('image') } as Express.Multer.File;
    mountainsRepo.findOne.mockResolvedValue({ id: mountainId });
    r2.uploadBuffer.mockResolvedValue({
      key: `mountains/${mountainId}/image.png`,
      url: `https://cdn.example/mountains/${mountainId}/image.png`,
    });
    imagesRepo.create.mockResolvedValue({
      id: 'image-id',
      image: 'https://cdn.example/mountains/example/image.png',
      sortOrder: 0,
    });

    await expect(service.create(mountainId, file)).resolves.toEqual({
      id: 'image-id',
      imageUrl: 'https://cdn.example/mountains/example/image.png',
      sortOrder: 0,
    });
    expect(r2.uploadBuffer).toHaveBeenCalledWith(mountainId, file);
    expect(imagesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ mountainId, image: expect.any(String) }),
    );
  });

  it('removes the uploaded object when database insertion fails', async () => {
    const mountainId = '550e8400-e29b-41d4-a716-446655440000';
    const uploaded = { key: `mountains/${mountainId}/image.png`, url: 'https://cdn/image.png' };
    mountainsRepo.findOne.mockResolvedValue({ id: mountainId });
    r2.uploadBuffer.mockResolvedValue(uploaded);
    imagesRepo.create.mockRejectedValue(new Error('database unavailable'));

    await expect(service.create(mountainId, {} as Express.Multer.File)).rejects.toThrow(
      'database unavailable',
    );
    expect(r2.deleteObject).toHaveBeenCalledWith(uploaded.key);
  });

  it('deletes the database row and its R2 object', async () => {
    imagesRepo.findOne.mockResolvedValue({
      id: 'image-id',
      mountainId: 'mountain-id',
      image: 'https://cdn/image.png',
    });
    imagesRepo.remove.mockResolvedValue({
      id: 'image-id',
      mountainId: 'mountain-id',
      image: 'https://cdn/image.png',
    });

    await expect(service.remove('mountain-id', 'image-id')).resolves.toEqual({
      id: 'image-id',
    });
    expect(r2.deleteByUrl).toHaveBeenCalledWith('https://cdn/image.png');
  });
});
