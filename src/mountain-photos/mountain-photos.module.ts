import { Module } from '@nestjs/common';
import { MountainPhotosService } from './mountain-photos.service.js';
import { MountainPhotosController } from './mountain-photos.controller.js';
import { MountainPhotosRepository } from './mountain-photos.repo.js';
import { MountainsModule } from '../mountains/mountains.module.js';
import { R2Module } from '../r2/r2.module.js';

@Module({
  controllers: [MountainPhotosController],
  imports: [MountainsModule, R2Module],
  providers: [MountainPhotosService, MountainPhotosRepository],
  exports: [MountainPhotosService],
})
export class MountainPhotosModule {}
