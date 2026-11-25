import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { codigoPrisma } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoriaDto) {
    try {
      return await this.prisma.categoria.create({ data: dto });
    } catch (erro) {
      if (codigoPrisma(erro) === 'P2002') {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
      throw erro;
    }
  }

  findAll() {
    return this.prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoria ${id} não encontrada`);
    return categoria;
  }

  async update(id: number, dto: UpdateCategoriaDto) {
    await this.findOne(id);
    try {
      return await this.prisma.categoria.update({ where: { id }, data: dto });
    } catch (erro) {
      if (codigoPrisma(erro) === 'P2002') {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
      throw erro;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    const emUso = await this.prisma.objeto.count({ where: { categoriaId: id } });
    if (emUso > 0) {
      throw new ConflictException(
        'Categoria possui objetos cadastrados e não pode ser excluída',
      );
    }
    return this.prisma.categoria.delete({ where: { id } });
  }
}
