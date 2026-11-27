import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Papel, StatusObjeto } from '../generated/prisma/client.js';
import { RetiradasService } from './retiradas.service.js';

const responsavel = {
  sub: 7,
  email: 'resp@ifrs.edu.br',
  papel: Papel.RESPONSAVEL,
};
const entrada = new Date('2026-11-01T00:00:00Z');

function criarServico(objeto: unknown) {
  const prisma: any = {
    objeto: {
      findUnique: vi.fn().mockResolvedValue(objeto),
      update: vi.fn().mockResolvedValue({}),
    },
    retirada: {
      create: vi.fn().mockResolvedValue({
        id: 1,
        objetoId: 1,
        objeto: { id: 1, status: StatusObjeto.ENCONTRADO },
      }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return { service: new RetiradasService(prisma), prisma };
}

describe('RetiradasService.create', () => {
  const dto = { objetoId: 1, retiradoPorNome: 'Maria' };

  it('404 quando o objeto não existe', async () => {
    const { service } = criarServico(null);
    await expect(service.create(dto, responsavel)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('400 quando o objeto ainda está PERDIDO', async () => {
    const { service } = criarServico({
      status: StatusObjeto.PERDIDO,
      dataOcorrencia: entrada,
    });
    await expect(service.create(dto, responsavel)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('409 quando o objeto já foi DEVOLVIDO', async () => {
    const { service } = criarServico({
      status: StatusObjeto.DEVOLVIDO,
      dataOcorrencia: entrada,
    });
    await expect(service.create(dto, responsavel)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('400 quando a retirada é anterior à entrada do objeto', async () => {
    const { service } = criarServico({
      status: StatusObjeto.ENCONTRADO,
      dataOcorrencia: entrada,
    });
    await expect(
      service.create(
        { ...dto, dataRetirada: '2026-10-01T00:00:00Z' },
        responsavel,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 quando a data da retirada está no futuro', async () => {
    const { service } = criarServico({
      status: StatusObjeto.ENCONTRADO,
      dataOcorrencia: entrada,
    });
    await expect(
      service.create(
        { ...dto, dataRetirada: '2999-01-01T00:00:00Z' },
        responsavel,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registra a retirada e muda o status do objeto para DEVOLVIDO', async () => {
    const { service, prisma } = criarServico({
      status: StatusObjeto.ENCONTRADO,
      dataOcorrencia: entrada,
    });
    const resultado = await service.create(dto, responsavel);

    expect(prisma.retirada.create).toHaveBeenCalledOnce();
    expect(prisma.retirada.create.mock.calls[0][0].data.responsavelId).toBe(7);
    expect(prisma.objeto.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: StatusObjeto.DEVOLVIDO },
    });
    expect(resultado.objeto.status).toBe(StatusObjeto.DEVOLVIDO);
  });
});
