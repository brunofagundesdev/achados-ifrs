import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Papel } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { ROLES_KEY } from './roles.decorator.js';
import type { UsuarioAutenticado } from './usuario-autenticado.js';

// Guard GLOBAL (registrado com APP_GUARD no AuthModule). Roda antes de toda rota:
//   1) rota com @Public()  -> passa direto;
//   2) valida o token JWT (header "Authorization: Bearer ...")  -> senao 401;
//   3) confere no banco se o usuario ainda existe e qual o papel ATUAL dele;
//   4) se a rota tem @Roles(...) e o papel nao esta na lista  -> 403.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const alvos = [context.getHandler(), context.getClass()];

    const publica = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      alvos,
    );
    if (publica) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token não informado');
    }

    let id: number;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number }>(token);
      id = payload.sub;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // O papel vem do banco (e nao do token) para que uma mudanca de papel
    // ou a exclusao do usuario valham imediatamente.
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, email: true, papel: true },
    });
    if (!usuario) throw new UnauthorizedException('Usuário não existe mais');

    const autenticado: UsuarioAutenticado = {
      sub: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
    };
    (request as Request & { user?: UsuarioAutenticado }).user = autenticado;

    const papeisPermitidos = this.reflector.getAllAndOverride<Papel[]>(
      ROLES_KEY,
      alvos,
    );
    if (papeisPermitidos?.length && !papeisPermitidos.includes(usuario.papel)) {
      throw new ForbiddenException('Seu perfil não tem permissão para isso');
    }
    return true;
  }
}
