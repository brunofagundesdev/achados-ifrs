import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ArmazenamentoService } from './armazenamento.service.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const arquivo = (buffer: Buffer, originalname = 'foto') => ({
  buffer,
  originalname,
  size: buffer.length,
});

describe('ArmazenamentoService - upload de fotos (RF05)', () => {
  let pasta: string;
  const service = new ArmazenamentoService();

  beforeAll(() => {
    pasta = mkdtempSync(join(tmpdir(), 'achados-uploads-'));
    process.env.UPLOADS_DIR = pasta;
  });
  afterAll(() => {
    rmSync(pasta, { recursive: true, force: true });
    delete process.env.UPLOADS_DIR;
  });

  it('grava a imagem no disco e devolve a URL /uploads/<uuid>.<ext>', async () => {
    const [url] = await service.salvarImagens([arquivo(PNG)]);
    expect(url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
    const caminho = join(pasta, url.replace('/uploads/', ''));
    expect(readFileSync(caminho).equals(PNG)).toBe(true);
  });

  it('detecta o formato pelo conteúdo, não pelo nome', async () => {
    const [url] = await service.salvarImagens([arquivo(JPG, 'enganosa.png')]);
    expect(url.endsWith('.jpg')).toBe(true);
  });

  it('recusa arquivo que não é imagem (400) e não grava nada', async () => {
    const texto = arquivo(Buffer.from('#!/bin/sh\necho oi'), 'script.png');
    await expect(service.salvarImagens([arquivo(PNG), texto])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('recusa envio sem arquivos (400)', async () => {
    await expect(service.salvarImagens([])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remove o arquivo do disco e ignora URLs externas / caminhos maliciosos', async () => {
    const [url] = await service.salvarImagens([arquivo(PNG)]);
    const caminho = join(pasta, url.replace('/uploads/', ''));
    await service.removerArquivos([url, 'http://exemplo/foto.jpg', '/uploads/../../etc/passwd']);
    expect(existsSync(caminho)).toBe(false);
  });
});
