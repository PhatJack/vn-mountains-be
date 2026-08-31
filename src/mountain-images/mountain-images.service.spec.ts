import { Test, TestingModule } from '@nestjs/testing';
import { MountainImagesService } from './mountain-images.service.js';

describe('MountainImagesService', () => {
  let service: MountainImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MountainImagesService],
    }).compile();

    service = module.get<MountainImagesService>(MountainImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
