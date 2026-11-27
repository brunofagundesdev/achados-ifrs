import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { codigoPrisma } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    try {
      return await this.prisma.tag.create({ data: dto });
    } catch (erro) {
      if (codigoPrisma(erro) === 'P2002') {
        throw new ConflictException('Já existe uma tag com este nome');
      }
      throw erro;
    }
  }

  findAll() {
    return this.prisma.tag.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException(`Tag ${id} não encontrada`);
    return tag;
  }

  async update(id: number, dto: UpdateTagDto) {
    await this.findOne(id);
    try {
      return await this.prisma.tag.update({ where: { id }, data: dto });
    } catch (erro) {
      if (codigoPrisma(erro) === 'P2002') {
        throw new ConflictException('Já existe uma tag com este nome');
      }
      throw erro;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tag.delete({ where: { id } });
  }
}
