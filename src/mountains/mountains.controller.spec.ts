import { Test, TestingModule } from '@nestjs/testing';
import { MountainsController } from './mountains.controller.js';
import { MountainsService } from './mountains.service.js';

describe('MountainsController', () => {
  let controller: MountainsController;
  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MountainsController],
      providers: [{ provide: MountainsService, useValue: mockService }],
    }).compile();

    controller = module.get<MountainsController>(MountainsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findAll to the service', async () => {
    await controller.findAll();
    expect(mockService.findAll).toHaveBeenCalled();
  });
});