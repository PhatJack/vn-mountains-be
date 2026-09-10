import { Module } from '@nestjs/common';
import { MountainsService } from './mountains.service.js';
import { MountainsController } from './mountains.controller.js';
import { MountainsRepository } from './mountains.repo.js';

@Module({
  controllers: [MountainsController],
  providers: [MountainsService, MountainsRepository],
})
export class MountainsModule {}
