import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ehAdministrador } from '../auth/permissoes.js';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePerfilDto } from './dto/create-perfil.dto.js';
import { UpdatePerfilDto } from './dto/update-perfil.dto.js';

const COM_USUARIO = {
  usuario: { select: { id: true, nome: true, email: true, papel: true } },
} as const;

@Injectable()
export class PerfisService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePerfilDto, atual: UsuarioAutenticado) {
    const donoId = dto.usuarioId ?? atual.sub;
    if (donoId !== atual.sub && !ehAdministrador(atual)) {
      throw new ForbiddenException('Você só pode criar o seu próprio perfil');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: donoId },
    });
    if (!usuario) throw new NotFoundException('Usuário informado não existe');

    // REGRA 1:1 - nao permitir dois perfis para o mesmo usuario.
    const jaTem = await this.prisma.perfil.findUnique({
      where: { usuarioId: donoId },
    });
    if (jaTem) throw new ConflictException('Este usuário já possui um perfil');

    return this.prisma.perfil.create({
      data: {
        telefone: dto.telefone,
        matricula: dto.matricula,
        usuarioId: donoId,
      },
      include: COM_USUARIO,
    });
  }

  findAll() {
    return this.prisma.perfil.findMany({ include: COM_USUARIO });
  }

  async findMe(atual: UsuarioAutenticado) {
    const perfil = await this.prisma.perfil.findUnique({
      where: { usuarioId: atual.sub },
      include: COM_USUARIO,
    });
    if (!perfil) throw new NotFoundException('Você ainda não possui perfil');
    return perfil;
  }

  async findOne(id: number, atual: UsuarioAutenticado) {
    const perfil = await this.prisma.perfil.findUnique({
      where: { id },
      include: COM_USUARIO,
    });
    if (!perfil) throw new NotFoundException(`Perfil ${id} não encontrado`);
    if (!ehAdministrador(atual) && perfil.usuarioId !== atual.sub) {
      throw new ForbiddenException('Você só pode acessar o seu próprio perfil');
    }
    return perfil;
  }

  async update(id: number, dto: UpdatePerfilDto, atual: UsuarioAutenticado) {
    await this.findOne(id, atual); // 404 / 403
    return this.prisma.perfil.update({
      where: { id },
      data: dto,
      include: COM_USUARIO,
    });
  }

  async remove(id: number, atual: UsuarioAutenticado) {
    await this.findOne(id, atual);
    return this.prisma.perfil.delete({ where: { id } });
  }
}
