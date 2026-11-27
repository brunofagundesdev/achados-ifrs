export function codigoPrisma(erro: unknown): string | undefined {
  if (typeof erro === 'object' && erro !== null && 'code' in erro) {
    return String((erro as { code: unknown }).code);
  }
  return undefined;
}
