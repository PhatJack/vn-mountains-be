import { Test, TestingModule } from '@nestjs/testing';
import { MountainImagesController } from './mountain-images.controller.js';
import { MountainImagesService } from './mountain-images.service.js';

describe('MountainImagesController', () => {
  let controller: MountainImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MountainImagesController],
      providers: [MountainImagesService],
    }).compile();

    controller = module.get<MountainImagesController>(MountainImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
