import { Module } from '@nestjs/common';
import { MountainImagesService } from './mountain-images.service.js';
import { MountainImagesController } from './mountain-images.controller.js';
import { MountainImagesRepository } from './mountain-images.repo.js';
import { MountainsModule } from '../mountains/mountains.module.js';
import { R2Module } from '../r2/r2.module.js';

@Module({
  controllers: [MountainImagesController],
  imports: [MountainsModule, R2Module],
  providers: [MountainImagesService, MountainImagesRepository],
  exports: [MountainImagesService],
})
export class MountainImagesModule {}
