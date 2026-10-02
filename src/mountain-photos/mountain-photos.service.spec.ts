import { Test, TestingModule } from '@nestjs/testing';
import { MountainPhotosService } from './mountain-photos.service.js';
import { MountainPhotosRepository } from './mountain-photos.repo.js';
import { MountainsRepository } from '../mountains/mountains.repo.js';
import { R2Service } from '../r2/r2.service.js';

describe('MountainPhotosService', () => {
  let service: MountainPhotosService;
  const photosRepo = {
    create: vi.fn(),
    findByMountainId: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
  };
  const mountainsRepo = { findOne: vi.fn() };
  const r2 = {
    uploadBuffer: vi.fn(),
    deleteObject: vi.fn(),
    urlForKey: vi.fn((key: string) => `https://cdn.example/${key}`),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MountainPhotosService,
        { provide: MountainPhotosRepository, useValue: photosRepo },
        { provide: MountainsRepository, useValue: mountainsRepo },
        { provide: R2Service, useValue: r2 },
      ],
    }).compile();

    service = module.get<MountainPhotosService>(MountainPhotosService);
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
    photosRepo.create.mockResolvedValue({
      id: 'image-id',
      storageKey: `mountains/${mountainId}/image.png`,
      caption: 'Hiker',
      takenAt: null,
      status: 'approved',
      createdAt: 123,
      updatedAt: 123,
    });

    await expect(service.create(mountainId, file, { caption: ' Hiker ' })).resolves.toEqual({
      id: 'image-id',
      imageUrl: `https://cdn.example/mountains/${mountainId}/image.png`,
      storageKey: `mountains/${mountainId}/image.png`,
      caption: 'Hiker',
      takenAt: null,
      status: 'approved',
      createdAt: 123,
      updatedAt: 123,
    });
    expect(r2.uploadBuffer).toHaveBeenCalledWith(mountainId, file);
    expect(photosRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mountainId,
        storageKey: uploadedKey(mountainId),
        caption: 'Hiker',
        status: 'approved',
      }),
    );
  });

  it('stores uploads with a null caption when omitted', async () => {
    const mountainId = '550e8400-e29b-41d4-a716-446655440000';
    mountainsRepo.findOne.mockResolvedValue({ id: mountainId });
    r2.uploadBuffer.mockResolvedValue({ key: 'image-key', url: 'https://cdn/image.png' });
    photosRepo.create.mockResolvedValue({
      id: 'image-id',
      storageKey: 'image-key',
      caption: null,
      takenAt: null,
      status: 'approved',
      createdAt: 1,
      updatedAt: 1,
    });

    await service.create(mountainId, {} as Express.Multer.File, { caption: '   ' });

    expect(photosRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ caption: null, status: 'approved' }),
    );
  });

  it('removes the uploaded object when database insertion fails', async () => {
    const mountainId = '550e8400-e29b-41d4-a716-446655440000';
    const uploaded = { key: `mountains/${mountainId}/image.png`, url: 'https://cdn/image.png' };
    mountainsRepo.findOne.mockResolvedValue({ id: mountainId });
    r2.uploadBuffer.mockResolvedValue(uploaded);
    photosRepo.create.mockRejectedValue(new Error('database unavailable'));

    await expect(service.create(mountainId, {} as Express.Multer.File)).rejects.toThrow(
      'database unavailable',
    );
    expect(r2.deleteObject).toHaveBeenCalledWith(uploaded.key);
  });

  it('deletes the database row and its R2 object', async () => {
    photosRepo.findOne.mockResolvedValue({
      id: 'image-id',
      mountainId: 'mountain-id',
      storageKey: 'mountains/mountain-id/image.png',
    });
    photosRepo.remove.mockResolvedValue({
      id: 'image-id',
      mountainId: 'mountain-id',
      storageKey: 'mountains/mountain-id/image.png',
    });

    await expect(service.remove('mountain-id', 'image-id')).resolves.toEqual({
      id: 'image-id',
    });
    expect(r2.deleteObject).toHaveBeenCalledWith('mountains/mountain-id/image.png');
  });

  function uploadedKey(mountainId: string) {
    return `mountains/${mountainId}/image.png`;
  }
});
