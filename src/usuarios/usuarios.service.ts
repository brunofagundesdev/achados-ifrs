import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ehAdministrador } from '../auth/permissoes.js';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import { codigoPrisma } from '../common/prisma-errors.js';
import { Papel } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AlterarPapelDto } from './dto/alterar-papel.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  email: true,
  papel: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.usuario.findMany({
      select: { ...CAMPOS_PUBLICOS, perfil: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number, atual: UsuarioAutenticado) {
    this.exigirAdminOuDono(id, atual);
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { ...CAMPOS_PUBLICOS, perfil: true },
    });
    if (!usuario) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return usuario;
  }

  async update(id: number, dto: UpdateUsuarioDto, atual: UsuarioAutenticado) {
    await this.findOne(id, atual);

    const data = { ...dto };
    if (dto.senha) data.senha = await bcrypt.hash(dto.senha, 10);

    try {
      return await this.prisma.usuario.update({
        where: { id },
        data,
        select: CAMPOS_PUBLICOS,
      });
    } catch (erro) {
      if (codigoPrisma(erro) === 'P2002') {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw erro;
    }
  }

  async alterarPapel(id: number, dto: AlterarPapelDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuário ${id} não encontrado`);

    if (usuario.papel === Papel.ADMINISTRADOR && dto.papel !== usuario.papel) {
      const admins = await this.prisma.usuario.count({
        where: { papel: Papel.ADMINISTRADOR },
      });
      if (admins <= 1) {
        throw new BadRequestException(
          'Não é possível rebaixar o único administrador do sistema',
        );
      }
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { papel: dto.papel },
      select: CAMPOS_PUBLICOS,
    });
  }

  async remove(id: number, atual: UsuarioAutenticado) {
    await this.findOne(id, atual);

    const [objetos, retiradas] = await Promise.all([
      this.prisma.objeto.count({ where: { registradoPorId: id } }),
      this.prisma.retirada.count({ where: { responsavelId: id } }),
    ]);
    if (objetos > 0 || retiradas > 0) {
      throw new ConflictException(
        'Usuário possui objetos ou retiradas registrados e não pode ser excluído',
      );
    }

    return this.prisma.usuario.delete({
      where: { id },
      select: CAMPOS_PUBLICOS,
    });
  }

  private exigirAdminOuDono(id: number, atual: UsuarioAutenticado) {
    if (!ehAdministrador(atual) && atual.sub !== id) {
      throw new ForbiddenException(
        'Você só pode acessar os seus próprios dados',
      );
    }
  }
}
