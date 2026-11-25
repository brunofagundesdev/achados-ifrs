import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  INCLUDE_CAMINHO,
  montarCaminho,
} from '../common/localizacao-caminho.js';
import { TipoLocalizacao } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLocalizacaoDto } from './dto/create-localizacao.dto.js';
import { ListLocalizacoesQueryDto } from './dto/list-localizacoes-query.dto.js';
import { UpdateLocalizacaoDto } from './dto/update-localizacao.dto.js';

// Qual tipo o PAI precisa ter para cada tipo de localizacao (RF07).
const TIPO_DO_PAI: Record<TipoLocalizacao, TipoLocalizacao | null> = {
  [TipoLocalizacao.CAMPUS]: null,
  [TipoLocalizacao.PREDIO]: TipoLocalizacao.CAMPUS,
  [TipoLocalizacao.ANDAR]: TipoLocalizacao.PREDIO,
  [TipoLocalizacao.SALA]: TipoLocalizacao.ANDAR,
};

@Injectable()
export class LocalizacoesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLocalizacaoDto) {
    await this.validarHierarquia(dto.tipo, dto.paiId);
    const criada = await this.prisma.localizacao.create({
      data: { nome: dto.nome, tipo: dto.tipo, paiId: dto.paiId },
      include: INCLUDE_CAMINHO,
    });
    return { ...criada, caminho: montarCaminho(criada) };
  }

  async findAll(query: ListLocalizacoesQueryDto) {
    const where: Prisma.LocalizacaoWhereInput = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.paiId) where.paiId = query.paiId;

    const lista = await this.prisma.localizacao.findMany({
      where,
      include: INCLUDE_CAMINHO,
      orderBy: { nome: 'asc' },
    });
    return lista.map((l) => ({ ...l, caminho: montarCaminho(l) }));
  }

  // Arvore completa (campus -> predios -> andares -> salas) para montar os
  // selects hierarquicos do formulario.
  async arvore() {
    const todas = await this.prisma.localizacao.findMany({
      orderBy: { nome: 'asc' },
    });
    type No = (typeof todas)[number] & { filhos: No[] };
    const porId = new Map<number, No>();
    for (const l of todas) porId.set(l.id, { ...l, filhos: [] });

    const raizes: No[] = [];
    for (const no of porId.values()) {
      const pai = no.paiId ? porId.get(no.paiId) : undefined;
      if (pai) pai.filhos.push(no);
      else raizes.push(no);
    }
    return raizes;
  }

  async findOne(id: number) {
    const localizacao = await this.prisma.localizacao.findUnique({
      where: { id },
      include: { ...INCLUDE_CAMINHO, filhos: true },
    });
    if (!localizacao) {
      throw new NotFoundException(`Localização ${id} não encontrada`);
    }
    return { ...localizacao, caminho: montarCaminho(localizacao) };
  }

  async update(id: number, dto: UpdateLocalizacaoDto) {
    const atual = await this.findOne(id);
    const tipo = dto.tipo ?? atual.tipo;
    const paiId = dto.paiId !== undefined ? dto.paiId : (atual.paiId ?? undefined);

    // Se mudou tipo ou pai, a hierarquia precisa continuar valida.
    await this.validarHierarquia(tipo, paiId);

    // Mudar o nivel de quem ja tem filhos quebraria a hierarquia deles.
    const mudouEstrutura =
      tipo !== atual.tipo || (paiId ?? null) !== atual.paiId;
    if (mudouEstrutura && atual.filhos.length > 0) {
      throw new ConflictException(
        'Não é possível mudar o tipo ou o pai de uma localização que possui sublocalizações',
      );
    }

    const atualizada = await this.prisma.localizacao.update({
      where: { id },
      data: { nome: dto.nome, tipo, paiId: paiId ?? null },
      include: INCLUDE_CAMINHO,
    });
    return { ...atualizada, caminho: montarCaminho(atualizada) };
  }

  async remove(id: number) {
    await this.findOne(id);
    const [filhos, objetos] = await Promise.all([
      this.prisma.localizacao.count({ where: { paiId: id } }),
      this.prisma.objeto.count({ where: { localizacaoId: id } }),
    ]);
    if (filhos > 0) {
      throw new ConflictException(
        'Localização possui sublocalizações e não pode ser excluída',
      );
    }
    if (objetos > 0) {
      throw new ConflictException(
        'Localização possui objetos cadastrados e não pode ser excluída',
      );
    }
    return this.prisma.localizacao.delete({ where: { id } });
  }

  // Ids da localizacao informada + todas as descendentes. Usado na busca de
  // objetos: filtrar por um predio traz tambem os objetos das salas dele.
  async idsComDescendentes(raizId: number): Promise<number[]> {
    const todas = await this.prisma.localizacao.findMany({
      select: { id: true, paiId: true },
    });
    const ids = [raizId];
    for (let i = 0; i < ids.length; i++) {
      for (const l of todas) {
        if (l.paiId === ids[i]) ids.push(l.id);
      }
    }
    return ids;
  }

  // REGRA DE NEGOCIO: respeita campus > predio > andar > sala.
  private async validarHierarquia(tipo: TipoLocalizacao, paiId?: number) {
    const tipoEsperado = TIPO_DO_PAI[tipo];

    if (tipoEsperado === null) {
      if (paiId !== undefined) {
        throw new BadRequestException('Um campus não pode ter localização pai');
      }
      return;
    }
    if (paiId === undefined) {
      throw new BadRequestException(
        `Informe o paiId: um(a) ${tipo} pertence a um(a) ${tipoEsperado}`,
      );
    }
    const pai = await this.prisma.localizacao.findUnique({
      where: { id: paiId },
    });
    if (!pai) throw new BadRequestException('Localização pai não existe');
    if (pai.tipo !== tipoEsperado) {
      throw new BadRequestException(
        `O pai de um(a) ${tipo} deve ser um(a) ${tipoEsperado}, mas foi informado um(a) ${pai.tipo}`,
      );
    }
  }
}
