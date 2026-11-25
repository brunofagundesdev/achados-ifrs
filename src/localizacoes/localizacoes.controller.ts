import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { Papel } from '../generated/prisma/client.js';
import { CreateLocalizacaoDto } from './dto/create-localizacao.dto.js';
import { ListLocalizacoesQueryDto } from './dto/list-localizacoes-query.dto.js';
import { UpdateLocalizacaoDto } from './dto/update-localizacao.dto.js';
import { LocalizacoesService } from './localizacoes.service.js';

@Controller('localizacoes')
export class LocalizacoesController {
  constructor(private readonly localizacoes: LocalizacoesService) {}

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Post()
  create(@Body() dto: CreateLocalizacaoDto) {
    return this.localizacoes.create(dto);
  }

  @Get()
  findAll(@Query() query: ListLocalizacoesQueryDto) {
    return this.localizacoes.findAll(query);
  }

  // Declarada ANTES de ":id" para "arvore" nao ser lido como id.
  @Get('arvore')
  arvore() {
    return this.localizacoes.arvore();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.localizacoes.findOne(id);
  }

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLocalizacaoDto,
  ) {
    return this.localizacoes.update(id, dto);
  }

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.localizacoes.remove(id);
  }
}
