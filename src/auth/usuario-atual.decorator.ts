import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UsuarioAutenticado } from './usuario-autenticado.js';

export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
    return contexto.switchToHttp().getRequest().user;
  },
);
