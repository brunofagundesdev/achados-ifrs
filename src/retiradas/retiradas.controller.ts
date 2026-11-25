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
import { CreateRetiradaDto } from './dto/create-retirada.dto.js';
import { UpdateRetiradaDto } from './dto/update-retirada.dto.js';
import { RetiradasService } from './retiradas.service.js';

// Retiradas contem dados pessoais: todo o controller e restrito a equipe.
@Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
@Controller('retiradas')
export class RetiradasController {
  constructor(private readonly retiradas: RetiradasService) {}

  @Post()
  create(
    @Body() dto: CreateRetiradaDto,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.retiradas.create(dto, atual);
  }

  @Get()
  findAll() {
    return this.retiradas.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.retiradas.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRetiradaDto) {
    return this.retiradas.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.retiradas.remove(id);
  }
}
