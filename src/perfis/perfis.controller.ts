import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { UsuarioAtual } from '../auth/usuario-atual.decorator.js';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import { Papel } from '../generated/prisma/client.js';
import { CreatePerfilDto } from './dto/create-perfil.dto.js';
import { UpdatePerfilDto } from './dto/update-perfil.dto.js';
import { PerfisService } from './perfis.service.js';

@Controller('perfis')
export class PerfisController {
  constructor(private readonly perfis: PerfisService) {}

  @Post()
  create(@Body() dto: CreatePerfilDto, @UsuarioAtual() atual: UsuarioAutenticado) {
    return this.perfis.create(dto, atual);
  }

  @Roles(Papel.ADMINISTRADOR)
  @Get()
  findAll() {
    return this.perfis.findAll();
  }

  // Declarada ANTES de ":id" para "me" nao ser lido como id.
  @Get('me')
  findMe(@UsuarioAtual() atual: UsuarioAutenticado) {
    return this.perfis.findMe(atual);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.perfis.findOne(id, atual);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePerfilDto,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.perfis.update(id, dto, atual);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.perfis.remove(id, atual);
  }
}
