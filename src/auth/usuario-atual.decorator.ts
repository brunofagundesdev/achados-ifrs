import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UsuarioAutenticado } from './usuario-autenticado.js';

// Atalho para pegar o usuario logado no controller:
//   findAll(@UsuarioAtual() usuario: UsuarioAutenticado) { ... }
export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
    return contexto.switchToHttp().getRequest().user;
  },
);
