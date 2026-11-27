import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ehEquipe } from '../auth/permissoes.js';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import {
  INCLUDE_CAMINHO,
  montarCaminho,
} from '../common/localizacao-caminho.js';
import { StatusObjeto } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';
import { LocalizacoesService } from '../localizacoes/localizacoes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ArmazenamentoService,
  type ArquivoEnviado,
} from '../uploads/armazenamento.service.js';
import { CreateFotoDto } from './dto/create-foto.dto.js';
import {
  CreateObjetoEncontradoDto,
  CreateObjetoPerdidoDto,
} from './dto/create-objeto.dto.js';
import { ListObjetosQueryDto } from './dto/list-objetos-query.dto.js';
import { UpdateObjetoDto } from './dto/update-objeto.dto.js';

const INCLUDE_OBJETO = {
  categoria: true,
  localizacao: { include: INCLUDE_CAMINHO },
  registradoPor: { select: { id: true, nome: true } },
  tags: true,
  fotos: true,
  retirada: true,
} satisfies Prisma.ObjetoInclude;

type ObjetoCompleto = Prisma.ObjetoGetPayload<{
  include: typeof INCLUDE_OBJETO;
}>;

@Injectable()
export class ObjetosService {
  constructor(
    private prisma: PrismaService,
    private localizacoes: LocalizacoesService,
    private armazenamento: ArmazenamentoService,
  ) {}

  criarPerdido(dto: CreateObjetoPerdidoDto, atual: UsuarioAutenticado) {
    return this.criar(dto, StatusObjeto.PERDIDO, atual, dto.contato);
  }

  criarEncontrado(dto: CreateObjetoEncontradoDto, atual: UsuarioAutenticado) {
    return this.criar(dto, StatusObjeto.ENCONTRADO, atual);
  }

  private async criar(
    dto: CreateObjetoEncontradoDto,
    status: StatusObjeto,
    atual: UsuarioAutenticado,
    contato?: string,
  ) {
    this.validarData(dto.data);
    await this.validarReferencias(
      dto.categoriaId,
      dto.localizacaoId,
      dto.tagIds,
    );

    const objeto = await this.prisma.objeto.create({
      data: {
        tipo: dto.tipo,
        descricao: dto.descricao,
        dataOcorrencia: new Date(dto.data),
        contato,
        status,
        sensivel: dto.sensivel ?? false,
        categoriaId: dto.categoriaId,
        localizacaoId: dto.localizacaoId,
        registradoPorId: atual.sub,
        tags: { connect: (dto.tagIds ?? []).map((id) => ({ id })) },
        fotos: { create: (dto.fotoUrls ?? []).map((url) => ({ url })) },
      },
      include: INCLUDE_OBJETO,
    });
    return this.serializar(objeto, atual);
  }

  async findAll(query: ListObjetosQueryDto, atual: UsuarioAutenticado) {
    const where: Prisma.ObjetoWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.categoriaId) where.categoriaId = query.categoriaId;
    if (query.tagId) where.tags = { some: { id: query.tagId } };
    if (query.tipo) {
      where.tipo = { contains: query.tipo, mode: 'insensitive' };
    }
    if (query.busca) {
      where.OR = [
        { tipo: { contains: query.busca, mode: 'insensitive' } },
        { descricao: { contains: query.busca, mode: 'insensitive' } },
      ];
    }
    if (query.localizacaoId) {
      where.localizacaoId = {
        in: await this.localizacoes.idsComDescendentes(query.localizacaoId),
      };
    }
    if (query.dataInicio || query.dataFim) {
      const periodo: { gte?: Date; lt?: Date } = {};
      if (query.dataInicio) periodo.gte = new Date(query.dataInicio);
      if (query.dataFim) {
        const fim = new Date(query.dataFim);
        fim.setUTCDate(fim.getUTCDate() + 1);
        periodo.lt = fim;
      }
      where.dataOcorrencia = periodo;
    }

    const objetos = await this.prisma.objeto.findMany({
      where,
      include: INCLUDE_OBJETO,
      orderBy: { dataOcorrencia: 'desc' },
    });
    return objetos.map((o) => this.serializar(o, atual));
  }

  async meus(atual: UsuarioAutenticado) {
    const objetos = await this.prisma.objeto.findMany({
      where: { registradoPorId: atual.sub },
      include: INCLUDE_OBJETO,
      orderBy: { criadoEm: 'desc' },
    });
    return objetos.map((o) => this.serializar(o, atual));
  }

  async findOne(id: number, atual: UsuarioAutenticado) {
    return this.serializar(await this.buscar(id), atual);
  }

  async update(id: number, dto: UpdateObjetoDto, atual: UsuarioAutenticado) {
    const objeto = await this.buscar(id);
    this.exigirEquipeOuDono(objeto, atual);
    this.exigirNaoDevolvido(objeto);

    if (dto.status !== undefined && !ehEquipe(atual)) {
      throw new ForbiddenException('Somente a equipe pode alterar o status');
    }

    const statusFinal = dto.status ?? objeto.status;
    const contatoFinal = dto.contato ?? objeto.contato;
    if (statusFinal === StatusObjeto.PERDIDO && !contatoFinal) {
      throw new BadRequestException('Objeto perdido precisa de um contato');
    }

    if (dto.data) this.validarData(dto.data);
    await this.validarReferencias(
      dto.categoriaId,
      dto.localizacaoId,
      dto.tagIds,
    );

    const data: Prisma.ObjetoUncheckedUpdateInput = {
      tipo: dto.tipo,
      descricao: dto.descricao,
      contato: dto.contato,
      sensivel: dto.sensivel,
      status: dto.status,
      categoriaId: dto.categoriaId,
      localizacaoId: dto.localizacaoId,
    };
    if (dto.data) data.dataOcorrencia = new Date(dto.data);
    if (dto.tagIds)
      data.tags = { set: dto.tagIds.map((tagId) => ({ id: tagId })) };

    const atualizado = await this.prisma.objeto.update({
      where: { id },
      data,
      include: INCLUDE_OBJETO,
    });
    return this.serializar(atualizado, atual);
  }

  async remove(id: number, atual: UsuarioAutenticado) {
    const objeto = await this.buscar(id);
    this.exigirEquipeOuDono(objeto, atual);
    this.exigirNaoDevolvido(objeto);

    const removido = await this.prisma.objeto.delete({ where: { id } });

    await this.armazenamento.removerArquivos(objeto.fotos.map((f) => f.url));
    return removido;
  }

  async adicionarFoto(
    id: number,
    dto: CreateFotoDto,
    atual: UsuarioAutenticado,
  ) {
    const objeto = await this.buscar(id);
    this.exigirEquipeOuDono(objeto, atual);
    this.exigirNaoDevolvido(objeto);
    return this.prisma.foto.create({ data: { url: dto.url, objetoId: id } });
  }

  async enviarFotos(
    id: number,
    arquivos: ArquivoEnviado[],
    atual: UsuarioAutenticado,
  ) {
    const objeto = await this.buscar(id);
    this.exigirEquipeOuDono(objeto, atual);
    this.exigirNaoDevolvido(objeto);

    const urls = await this.armazenamento.salvarImagens(arquivos);
    try {
      return await this.prisma.$transaction(
        urls.map((url) =>
          this.prisma.foto.create({ data: { url, objetoId: id } }),
        ),
      );
    } catch (erro) {
      await this.armazenamento.removerArquivos(urls);
      throw erro;
    }
  }

  async removerFoto(id: number, fotoId: number, atual: UsuarioAutenticado) {
    const objeto = await this.buscar(id);
    this.exigirEquipeOuDono(objeto, atual);
    this.exigirNaoDevolvido(objeto);

    const foto = await this.prisma.foto.findFirst({
      where: { id: fotoId, objetoId: id },
    });
    if (!foto)
      throw new NotFoundException(`Foto ${fotoId} não encontrada neste objeto`);
    const removida = await this.prisma.foto.delete({ where: { id: fotoId } });
    await this.armazenamento.removerArquivos([foto.url]);
    return removida;
  }

  private async buscar(id: number): Promise<ObjetoCompleto> {
    const objeto = await this.prisma.objeto.findUnique({
      where: { id },
      include: INCLUDE_OBJETO,
    });
    if (!objeto) throw new NotFoundException(`Objeto ${id} não encontrado`);
    return objeto;
  }

  private serializar(objeto: ObjetoCompleto, usuario: UsuarioAutenticado) {
    const equipe = ehEquipe(usuario);
    const dono = objeto.registradoPorId === usuario.sub;
    const ocultarFotos = objeto.sensivel && !equipe && !dono;

    return {
      ...objeto,
      fotos: ocultarFotos ? [] : objeto.fotos,
      fotosOcultas: ocultarFotos,
      retirada:
        equipe || !objeto.retirada
          ? objeto.retirada
          : { dataRetirada: objeto.retirada.dataRetirada },
      localizacaoCaminho: montarCaminho(objeto.localizacao),
    };
  }

  private exigirEquipeOuDono(
    objeto: { registradoPorId: number },
    atual: UsuarioAutenticado,
  ) {
    if (!ehEquipe(atual) && objeto.registradoPorId !== atual.sub) {
      throw new ForbiddenException(
        'Somente a equipe ou quem registrou o objeto pode fazer isso',
      );
    }
  }

  private exigirNaoDevolvido(objeto: { status: StatusObjeto }) {
    if (objeto.status === StatusObjeto.DEVOLVIDO) {
      throw new ConflictException(
        'Objeto já devolvido não pode ser alterado nem excluído',
      );
    }
  }

  private validarData(iso: string) {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) {
      throw new BadRequestException('Data inválida');
    }
    if (data.getTime() > Date.now()) {
      throw new BadRequestException('A data não pode estar no futuro');
    }
  }

  private async validarReferencias(
    categoriaId?: number,
    localizacaoId?: number,
    tagIds?: number[],
  ) {
    if (categoriaId !== undefined) {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: categoriaId },
      });
      if (!categoria)
        throw new BadRequestException('Categoria informada não existe');
    }
    if (localizacaoId !== undefined) {
      const localizacao = await this.prisma.localizacao.findUnique({
        where: { id: localizacaoId },
      });
      if (!localizacao)
        throw new BadRequestException('Localização informada não existe');
    }
    if (tagIds?.length) {
      const ids = [...new Set(tagIds)];
      const existentes = await this.prisma.tag.count({
        where: { id: { in: ids } },
      });
      if (existentes !== ids.length) {
        throw new BadRequestException('Alguma das tags informadas não existe');
      }
    }
  }
}
