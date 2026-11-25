import type { Papel } from '../generated/prisma/client.js';

// O que o AuthGuard coloca em request.user depois de validar o token.
export type UsuarioAutenticado = {
  sub: number; // id do usuario
  email: string;
  papel: Papel;
};
