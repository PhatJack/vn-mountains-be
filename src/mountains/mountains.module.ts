import { Module } from '@nestjs/common';
import { MountainsService } from './mountains.service.js';
import { MountainsController } from './mountains.controller.js';

@Module({
  controllers: [MountainsController],
  providers: [MountainsService],
})
export class MountainsModule {}
