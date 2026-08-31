import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './db/database.module.js';
import { MountainsModule } from './mountains/mountains.module.js';
import { MountainImagesModule } from './mountain-images/mountain-images.module.js';
import { LoggerMiddleware } from './logger/logger.middleware.js';

@Module({
  imports: [DatabaseModule, MountainsModule, MountainImagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('/*');
  }
}
