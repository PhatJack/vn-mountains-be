import { Test, TestingModule } from '@nestjs/testing';
import { MountainPhotosController } from './mountain-photos.controller.js';
import { MountainPhotosService } from './mountain-photos.service.js';

describe('MountainPhotosController', () => {
  let controller: MountainPhotosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MountainPhotosController],
      providers: [{ provide: MountainPhotosService, useValue: {} }],
    }).compile();

    controller = module.get<MountainPhotosController>(MountainPhotosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
