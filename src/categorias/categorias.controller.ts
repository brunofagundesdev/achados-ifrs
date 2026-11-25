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
import { Papel } from '../generated/prisma/client.js';
import { CategoriasService } from './categorias.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

// Leitura: qualquer usuario autenticado. Escrita: equipe do setor.
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Post()
  create(@Body() dto: CreateCategoriaDto) {
    return this.categorias.create(dto);
  }

  @Get()
  findAll() {
    return this.categorias.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categorias.findOne(id);
  }

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoriaDto) {
    return this.categorias.update(id, dto);
  }

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categorias.remove(id);
  }
}
