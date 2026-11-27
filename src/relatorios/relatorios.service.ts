import { Injectable } from '@nestjs/common';
import {
  INCLUDE_CAMINHO,
  montarCaminho,
} from '../common/localizacao-caminho.js';
import { StatusObjeto } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  async objetosDetalhados(status?: StatusObjeto) {
    const objetos = await this.prisma.objeto.findMany({
      where: status ? { status } : undefined,
      include: {
        categoria: true,
        localizacao: { include: INCLUDE_CAMINHO },
        registradoPor: {
          select: { id: true, nome: true, email: true, perfil: true },
        },
        tags: true,
        _count: { select: { fotos: true } },
        retirada: {
          include: { responsavel: { select: { id: true, nome: true } } },
        },
      },
      orderBy: { dataOcorrencia: 'desc' },
    });
    return objetos.map((o) => ({
      ...o,
      localizacaoCaminho: montarCaminho(o.localizacao),
    }));
  }

  async retiradasDetalhadas() {
    const retiradas = await this.prisma.retirada.findMany({
      include: {
        objeto: {
          include: {
            categoria: true,
            localizacao: { include: INCLUDE_CAMINHO },
            registradoPor: { select: { id: true, nome: true } },
          },
        },
        responsavel: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { dataRetirada: 'desc' },
    });
    return retiradas.map((r) => ({
      ...r,
      localizacaoCaminho: montarCaminho(r.objeto.localizacao),
    }));
  }

  async dashboard() {
    const where = (status: StatusObjeto): Prisma.ObjetoWhereInput => ({
      status,
    });

    const [
      totalObjetos,
      perdidos,
      encontrados,
      devolvidos,
      usuarios,
      retiradas,
      porCategoria,
      porLocalizacao,
    ] = await Promise.all([
      this.prisma.objeto.count(),
      this.prisma.objeto.count({ where: where(StatusObjeto.PERDIDO) }),
      this.prisma.objeto.count({ where: where(StatusObjeto.ENCONTRADO) }),
      this.prisma.objeto.count({ where: where(StatusObjeto.DEVOLVIDO) }),
      this.prisma.usuario.count(),
      this.prisma.retirada.count(),

      this.prisma.categoria.findMany({
        select: { id: true, nome: true, _count: { select: { objetos: true } } },
        orderBy: { objetos: { _count: 'desc' } },
      }),

      this.prisma.localizacao.findMany({
        where: { objetos: { some: {} } },
        select: {
          id: true,
          nome: true,
          tipo: true,
          _count: { select: { objetos: true } },
        },
        orderBy: { objetos: { _count: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      totalObjetos,
      porStatus: { perdidos, encontrados, devolvidos },
      totalUsuarios: usuarios,
      totalRetiradas: retiradas,

      taxaDevolucao:
        encontrados + devolvidos === 0
          ? 0
          : Number(
              ((devolvidos / (encontrados + devolvidos)) * 100).toFixed(1),
            ),
      porCategoria: porCategoria.map((c) => ({
        id: c.id,
        nome: c.nome,
        total: c._count.objetos,
      })),
      localizacoesComMaisObjetos: porLocalizacao.map((l) => ({
        id: l.id,
        nome: l.nome,
        tipo: l.tipo,
        total: l._count.objetos,
      })),
    };
  }
}
