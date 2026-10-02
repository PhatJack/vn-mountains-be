import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './db/database.module.js';
import { MountainsModule } from './mountains/mountains.module.js';
import { MountainPhotosModule } from './mountain-photos/mountain-photos.module.js';
import { LoggerMiddleware } from './logger/logger.middleware.js';
import { R2Module } from './r2/r2.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    DatabaseModule,
    MountainsModule,
    MountainPhotosModule,
		R2Module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('/*');
  }
}
