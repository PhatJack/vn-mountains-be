import { Module } from '@nestjs/common';
import { MountainsService } from './mountains.service.js';
import { MountainsController } from './mountains.controller.js';
import { MountainsRepository } from './mountains.repo.js';
import { R2Module } from '../r2/r2.module.js';

@Module({
  imports: [R2Module],
  controllers: [MountainsController],
  providers: [MountainsService, MountainsRepository],
  exports: [MountainsRepository],
})
export class MountainsModule {}
