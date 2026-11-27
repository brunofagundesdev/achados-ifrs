import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TipoLocalizacao } from '../generated/prisma/client.js';
import { LocalizacoesService } from './localizacoes.service.js';

function criarServico(pai: unknown = null) {
  const prisma: any = {
    localizacao: {
      findUnique: vi.fn().mockResolvedValue(pai),
      create: vi.fn().mockResolvedValue({ id: 10, nome: 'X', pai: null }),
    },
  };
  return { service: new LocalizacoesService(prisma), prisma };
}

describe('LocalizacoesService - hierarquia campus > prédio > andar > sala', () => {
  it('aceita CAMPUS sem pai', async () => {
    const { service, prisma } = criarServico();
    await service.create({
      nome: 'Campus Rio Grande',
      tipo: TipoLocalizacao.CAMPUS,
    });
    expect(prisma.localizacao.create).toHaveBeenCalledOnce();
  });

  it('400 quando CAMPUS recebe pai', async () => {
    const { service } = criarServico();
    await expect(
      service.create({
        nome: 'Campus',
        tipo: TipoLocalizacao.CAMPUS,
        paiId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 quando SALA não informa pai', async () => {
    const { service } = criarServico();
    await expect(
      service.create({ nome: 'Sala 101', tipo: TipoLocalizacao.SALA }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 quando o pai não existe', async () => {
    const { service } = criarServico(null);
    await expect(
      service.create({
        nome: 'Prédio A',
        tipo: TipoLocalizacao.PREDIO,
        paiId: 99,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 quando o pai tem o tipo errado (SALA dentro de PREDIO)', async () => {
    const { service } = criarServico({ id: 2, tipo: TipoLocalizacao.PREDIO });
    await expect(
      service.create({
        nome: 'Sala 101',
        tipo: TipoLocalizacao.SALA,
        paiId: 2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aceita PREDIO dentro de CAMPUS', async () => {
    const { service, prisma } = criarServico({
      id: 1,
      tipo: TipoLocalizacao.CAMPUS,
    });
    await service.create({
      nome: 'Prédio A',
      tipo: TipoLocalizacao.PREDIO,
      paiId: 1,
    });
    expect(prisma.localizacao.create).toHaveBeenCalledOnce();
  });
});
