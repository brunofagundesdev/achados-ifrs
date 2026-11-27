import { Papel } from '../generated/prisma/client.js';
import type { UsuarioAutenticado } from './usuario-autenticado.js';

export function ehEquipe(usuario: UsuarioAutenticado): boolean {
  return (
    usuario.papel === Papel.RESPONSAVEL || usuario.papel === Papel.ADMINISTRADOR
  );
}

export function ehAdministrador(usuario: UsuarioAutenticado): boolean {
  return usuario.papel === Papel.ADMINISTRADOR;
}