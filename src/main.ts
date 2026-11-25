import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { pastaUploads } from './uploads/armazenamento.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Valida todos os DTOs; "whitelist" descarta campos que nao existem no DTO
  // e "transform" converte tipos (ex.: query string "5" -> 5).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors(); // necessario para um frontend em outra porta
  // Fotos enviadas por upload: GET /uploads/<arquivo>. Os nomes sao UUIDs
  // aleatorios, entao so quem recebeu a URL pela API consegue abrir a imagem.
  app.useStaticAssets(pastaUploads(), {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
