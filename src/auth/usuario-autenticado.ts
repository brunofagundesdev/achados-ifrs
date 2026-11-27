import type { Papel } from '../generated/prisma/client.js';

export type UsuarioAutenticado = {
  sub: number;
  email: string;
  papel: Papel;
};
