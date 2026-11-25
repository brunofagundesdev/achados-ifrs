import { Module } from '@nestjs/common';
import { LocalizacoesModule } from '../localizacoes/localizacoes.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { ObjetosController } from './objetos.controller.js';
import { ObjetosService } from './objetos.service.js';

@Module({
  imports: [LocalizacoesModule, UploadsModule],
  controllers: [ObjetosController],
  providers: [ObjetosService],
})
export class ObjetosModule {}
