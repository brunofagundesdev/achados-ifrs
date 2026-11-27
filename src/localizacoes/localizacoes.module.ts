import { Module } from '@nestjs/common';
import { LocalizacoesController } from './localizacoes.controller.js';
import { LocalizacoesService } from './localizacoes.service.js';

@Module({
  controllers: [LocalizacoesController],
  providers: [LocalizacoesService],
  exports: [LocalizacoesService],
})
export class LocalizacoesModule {}
