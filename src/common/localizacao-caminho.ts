import type { Prisma } from '../generated/prisma/client.js';

// A hierarquia tem no maximo 4 niveis (campus > predio > andar > sala).
// Este "include" traz a sala e os 3 ancestrais em uma unica consulta.
export const INCLUDE_CAMINHO = {
  pai: { include: { pai: { include: { pai: true } } } },
} satisfies Prisma.LocalizacaoInclude;

export interface NoLocalizacao {
  nome: string;
  pai?: NoLocalizacao | null;
}

// Monta o texto "Campus Rio Grande > Prédio A > 1º andar > Sala 101".
export function montarCaminho(no: NoLocalizacao | null | undefined): string {
  const partes: string[] = [];
  let atual = no;
  while (atual) {
    partes.unshift(atual.nome);
    atual = atual.pai;
  }
  return partes.join(' > ');
}
