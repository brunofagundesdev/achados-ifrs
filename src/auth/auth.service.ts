import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Papel } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existe = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existe) throw new ConflictException('E-mail já cadastrado');

    // Bootstrap: o PRIMEIRO usuario do sistema vira ADMINISTRADOR (alguem
    // precisa promover os demais). Todos os outros entram como USUARIO.
    const total = await this.prisma.usuario.count();
    const papel = total === 0 ? Papel.ADMINISTRADOR : Papel.USUARIO;

    const senha = await bcrypt.hash(dto.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: { nome: dto.nome, email: dto.email, senha, papel },
    });
    // nunca devolver a senha!
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    };
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    // Mesma mensagem para e-mail inexistente e senha errada (nao revela qual falhou).
    if (!usuario || !(await bcrypt.compare(dto.senha, usuario.senha))) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const token = await this.jwt.signAsync({
      sub: usuario.id,
      email: usuario.email,
    });
    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      },
    };
  }
}
