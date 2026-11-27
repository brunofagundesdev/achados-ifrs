import { setDefaultResultOrder } from 'node:dns';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { pastaUploads } from './uploads/armazenamento.service.js';

async function bootstrap() {
  setDefaultResultOrder('ipv4first');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  app.useStaticAssets(pastaUploads(), {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
