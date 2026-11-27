import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { Papel } from '../generated/prisma/client.js';
import { ObjetosDetalhadosQueryDto } from './objetos-detalhados-query.dto.js';
import { RelatoriosService } from './relatorios.service.js';

@Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
@Controller('relatorios')
export class RelatoriosController {
  constructor(private relatorios: RelatoriosService) {}

  @Get('objetos-detalhados')
  objetos(@Query() query: ObjetosDetalhadosQueryDto) {
    return this.relatorios.objetosDetalhados(query.status);
  }

  @Get('retiradas-detalhadas')
  retiradas() {
    return this.relatorios.retiradasDetalhadas();
  }

  @Get('dashboard')
  dashboard() {
    return this.relatorios.dashboard();
  }
}
