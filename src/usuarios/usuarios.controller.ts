import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { UsuarioAtual } from '../auth/usuario-atual.decorator.js';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import { Papel } from '../generated/prisma/client.js';
import { AlterarPapelDto } from './dto/alterar-papel.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Roles(Papel.ADMINISTRADOR)
  @Get()
  findAll() {
    return this.usuarios.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.usuarios.findOne(id, atual);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.usuarios.update(id, dto, atual);
  }

  @Roles(Papel.ADMINISTRADOR)
  @Patch(':id/papel')
  alterarPapel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AlterarPapelDto,
  ) {
    return this.usuarios.alterarPapel(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.usuarios.remove(id, atual);
  }
}
