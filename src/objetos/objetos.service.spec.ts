import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Papel, StatusObjeto } from '../generated/prisma/client.js';
import { ObjetosService } from './objetos.service.js';

const DONO_ID = 10;

function objetoSensivel() {
  return {
    id: 1,
    tipo: 'Carteira',
    sensivel: true,
    status: StatusObjeto.ENCONTRADO,
    registradoPorId: DONO_ID,
    localizacao: { nome: 'Sala 101', pai: { nome: '1º andar', pai: null } },
    fotos: [{ id: 1, url: 'http://exemplo/foto.jpg', objetoId: 1 }],
    retirada: null,
  };
}

function criarServico(objeto: unknown) {
  const prisma: any = {
    objeto: { findUnique: vi.fn().mockResolvedValue(objeto) },
  };
  return new ObjetosService(prisma, {} as any, {} as any);
}

const comum = { sub: 99, email: 'a@ifrs.edu.br', papel: Papel.USUARIO };
const equipe = { sub: 50, email: 'r@ifrs.edu.br', papel: Papel.RESPONSAVEL };
const dono = { sub: DONO_ID, email: 'd@ifrs.edu.br', papel: Papel.USUARIO };

describe('ObjetosService - fotos de objeto sensível (RF10)', () => {
  it('oculta as fotos para usuário comum', async () => {
    const r = await criarServico(objetoSensivel()).findOne(1, comum);
    expect(r.fotos).toEqual([]);
    expect(r.fotosOcultas).toBe(true);
  });

  it('mostra as fotos para a equipe', async () => {
    const r = await criarServico(objetoSensivel()).findOne(1, equipe);
    expect(r.fotos).toHaveLength(1);
    expect(r.fotosOcultas).toBe(false);
  });

  it('mostra as fotos para quem registrou o objeto', async () => {
    const r = await criarServico(objetoSensivel()).findOne(1, dono);
    expect(r.fotos).toHaveLength(1);
  });

  it('monta o caminho hierárquico da localização', async () => {
    const r = await criarServico(objetoSensivel()).findOne(1, equipe);
    expect(r.localizacaoCaminho).toBe('1º andar > Sala 101');
  });
});

describe('ObjetosService - permissões de edição', () => {
  it('usuário comum não edita objeto de outra pessoa (403)', async () => {
    const service = criarServico(objetoSensivel());
    await expect(service.update(1, { descricao: 'x' }, comum)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('usuário comum não altera o status nem do próprio objeto (403)', async () => {
    const service = criarServico(objetoSensivel());
    await expect(
      service.update(1, { status: StatusObjeto.PERDIDO }, dono),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
