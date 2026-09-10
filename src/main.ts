import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? '').trim();

  if (corsOrigins) {
    const allowAll = corsOrigins === '*';
    app.enableCors({
      origin: allowAll ? true : corsOrigins.split(',').map((s) => s.trim()).filter(Boolean),
      credentials: !allowAll,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  await app.listen(config.get<number>('PORT') ?? 7001);
}
await bootstrap();