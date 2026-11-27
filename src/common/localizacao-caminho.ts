import type { Prisma } from '../generated/prisma/client.js';

export const INCLUDE_CAMINHO = {
  pai: { include: { pai: { include: { pai: true } } } },
} satisfies Prisma.LocalizacaoInclude;

export interface NoLocalizacao {
  nome: string;
  pai?: NoLocalizacao | null;
}

export function montarCaminho(no: NoLocalizacao | null | undefined): string {
  const partes: string[] = [];
  let atual = no;
  while (atual) {
    partes.unshift(atual.nome);
    atual = atual.pai;
  }
  return partes.join(' > ');
}
