import { Module } from '@nestjs/common';
import { MountainImagesService } from './mountain-images.service.js';
import { MountainImagesController } from './mountain-images.controller.js';

@Module({
  controllers: [MountainImagesController],
  providers: [MountainImagesService],
})
export class MountainImagesModule {}
