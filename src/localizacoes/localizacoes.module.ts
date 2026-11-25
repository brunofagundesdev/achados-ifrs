import { Module } from '@nestjs/common';
import { LocalizacoesController } from './localizacoes.controller.js';
import { LocalizacoesService } from './localizacoes.service.js';

// Exporta o service porque o ObjetosModule usa idsComDescendentes() na busca.
@Module({
  controllers: [LocalizacoesController],
  providers: [LocalizacoesService],
  exports: [LocalizacoesService],
})
export class LocalizacoesModule {}
