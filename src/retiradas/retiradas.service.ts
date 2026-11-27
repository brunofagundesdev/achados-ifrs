import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import { StatusObjeto } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRetiradaDto } from './dto/create-retirada.dto.js';
import { UpdateRetiradaDto } from './dto/update-retirada.dto.js';

const COMPLETA = {
  objeto: { include: { categoria: true } },
  responsavel: { select: { id: true, nome: true, email: true } },
} as const;

@Injectable()
export class RetiradasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRetiradaDto, responsavel: UsuarioAutenticado) {
    const objeto = await this.prisma.objeto.findUnique({
      where: { id: dto.objetoId },
    });
    if (!objeto) throw new NotFoundException('Objeto não encontrado');

    if (objeto.status === StatusObjeto.DEVOLVIDO) {
      throw new ConflictException('Este objeto já foi devolvido');
    }
    if (objeto.status !== StatusObjeto.ENCONTRADO) {
      throw new BadRequestException(
        'Só é possível registrar a retirada de objetos com status ENCONTRADO',
      );
    }

    const dataRetirada = dto.dataRetirada
      ? new Date(dto.dataRetirada)
      : new Date();
    if (dataRetirada.getTime() > Date.now()) {
      throw new BadRequestException(
        'A data da retirada não pode estar no futuro',
      );
    }
    if (dataRetirada.getTime() < objeto.dataOcorrencia.getTime()) {
      throw new BadRequestException(
        'A retirada não pode ser anterior à data de entrada do objeto',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const retirada = await tx.retirada.create({
        data: {
          objetoId: dto.objetoId,
          retiradoPorNome: dto.retiradoPorNome,
          retiradoPorDocumento: dto.retiradoPorDocumento,
          dataRetirada,
          responsavelId: responsavel.sub,
        },
        include: COMPLETA,
      });
      await tx.objeto.update({
        where: { id: dto.objetoId },
        data: { status: StatusObjeto.DEVOLVIDO },
      });

      return {
        ...retirada,
        objeto: { ...retirada.objeto, status: StatusObjeto.DEVOLVIDO },
      };
    });
  }

  findAll() {
    return this.prisma.retirada.findMany({
      include: COMPLETA,
      orderBy: { dataRetirada: 'desc' },
    });
  }

  async findOne(id: number) {
    const retirada = await this.prisma.retirada.findUnique({
      where: { id },
      include: COMPLETA,
    });
    if (!retirada) throw new NotFoundException(`Retirada ${id} não encontrada`);
    return retirada;
  }

  async update(id: number, dto: UpdateRetiradaDto) {
    const atual = await this.findOne(id);

    const dataRetirada = dto.dataRetirada
      ? new Date(dto.dataRetirada)
      : undefined;
    if (dataRetirada) {
      if (dataRetirada.getTime() > Date.now()) {
        throw new BadRequestException(
          'A data da retirada não pode estar no futuro',
        );
      }
      if (dataRetirada.getTime() < atual.objeto.dataOcorrencia.getTime()) {
        throw new BadRequestException(
          'A retirada não pode ser anterior à data de entrada do objeto',
        );
      }
    }

    return this.prisma.retirada.update({
      where: { id },
      data: {
        retiradoPorNome: dto.retiradoPorNome,
        retiradoPorDocumento: dto.retiradoPorDocumento,
        dataRetirada,
      },
      include: COMPLETA,
    });
  }

  async remove(id: number) {
    const retirada = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.objeto.update({
        where: { id: retirada.objetoId },
        data: { status: StatusObjeto.ENCONTRADO },
      });
      return tx.retirada.delete({ where: { id } });
    });
  }
}
