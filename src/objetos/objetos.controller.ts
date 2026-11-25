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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../auth/roles.decorator.js';
import { UsuarioAtual } from '../auth/usuario-atual.decorator.js';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import { Papel } from '../generated/prisma/client.js';
import { CreateFotoDto } from './dto/create-foto.dto.js';
import {
  CreateObjetoEncontradoDto,
  CreateObjetoPerdidoDto,
} from './dto/create-objeto.dto.js';
import { ListObjetosQueryDto } from './dto/list-objetos-query.dto.js';
import { UpdateObjetoDto } from './dto/update-objeto.dto.js';
import { ObjetosService } from './objetos.service.js';
import {
  MAXIMO_FOTOS_POR_ENVIO,
  TAMANHO_MAXIMO_FOTO,
} from '../uploads/armazenamento.service.js';

@Controller('objetos')
export class ObjetosController {
  constructor(private readonly objetos: ObjetosService) {}

  // RF03 - qualquer usuario autenticado
  @Post('perdidos')
  criarPerdido(
    @Body() dto: CreateObjetoPerdidoDto,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.criarPerdido(dto, atual);
  }

  // RF04 - somente responsavel ou administrador
  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Post('encontrados')
  criarEncontrado(
    @Body() dto: CreateObjetoEncontradoDto,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.criarEncontrado(dto, atual);
  }

  // RF06 - consulta e busca
  @Get()
  findAll(
    @Query() query: ListObjetosQueryDto,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.findAll(query, atual);
  }

  // Declarada ANTES de ":id" para "meus" nao ser lido como id.
  @Get('meus')
  meus(@UsuarioAtual() atual: UsuarioAutenticado) {
    return this.objetos.meus(atual);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.findOne(id, atual);
  }

  // RF08
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateObjetoDto,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.update(id, dto, atual);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.remove(id, atual);
  }

  // RF05 - fotografias
  @Post(':id/fotos')
  adicionarFoto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateFotoDto,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.adicionarFoto(id, dto, atual);
  }

  // RF05 - upload do arquivo (multipart/form-data, campo "fotos", ate 5 imagens
  // de 5 MB). O arquivo fica em memoria ate as permissoes serem conferidas e so
  // entao e gravado no disco do servidor.
  @Post(':id/fotos/upload')
  @UseInterceptors(
    FilesInterceptor('fotos', MAXIMO_FOTOS_POR_ENVIO, {
      storage: memoryStorage(),
      limits: { fileSize: TAMANHO_MAXIMO_FOTO },
    }),
  )
  enviarFotos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() arquivos: Express.Multer.File[],
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.enviarFotos(id, arquivos, atual);
  }

  @Delete(':id/fotos/:fotoId')
  removerFoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('fotoId', ParseIntPipe) fotoId: number,
    @UsuarioAtual() atual: UsuarioAutenticado,
  ) {
    return this.objetos.removerFoto(id, fotoId, atual);
  }
}
