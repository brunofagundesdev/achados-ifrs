import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export const pastaUploads = () => resolve(process.env.UPLOADS_DIR ?? 'uploads');
export const PREFIXO_URL_UPLOADS = '/uploads/';
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;
export const MAXIMO_FOTOS_POR_ENVIO = 5;

const FORMATOS = [
  {
    ext: 'jpg',
    confere: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'png',
    confere: (b: Buffer) =>
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: 'webp',
    confere: (b: Buffer) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    ext: 'gif',
    confere: (b: Buffer) => b.subarray(0, 4).toString('ascii') === 'GIF8',
  },
];

export interface ArquivoEnviado {
  buffer: Buffer;
  originalname: string;
  size: number;
}

@Injectable()
export class ArmazenamentoService {
  private readonly logger = new Logger(ArmazenamentoService.name);

  validarImagens(arquivos: ArquivoEnviado[]) {
    if (!arquivos?.length) {
      throw new BadRequestException(
        'Envie ao menos um arquivo no campo "fotos"',
      );
    }
    return arquivos.map((arquivo) => {
      const formato = FORMATOS.find((f) => f.confere(arquivo.buffer));
      if (!formato) {
        throw new BadRequestException(
          `"${arquivo.originalname}" não é uma imagem válida (JPG, PNG, WEBP ou GIF)`,
        );
      }
      return { arquivo, ext: formato.ext };
    });
  }

  async salvarImagens(arquivos: ArquivoEnviado[]): Promise<string[]> {
    const validados = this.validarImagens(arquivos);
    await mkdir(pastaUploads(), { recursive: true });

    const urls: string[] = [];
    try {
      for (const { arquivo, ext } of validados) {
        const nome = `${randomUUID()}.${ext}`;
        await writeFile(join(pastaUploads(), nome), arquivo.buffer);
        urls.push(PREFIXO_URL_UPLOADS + nome);
      }
    } catch (erro) {
      await this.removerArquivos(urls);
      throw erro;
    }
    return urls;
  }

  async removerArquivos(urls: string[]) {
    for (const url of urls) {
      if (!url.startsWith(PREFIXO_URL_UPLOADS)) continue;

      const caminho = join(pastaUploads(), basename(url));
      try {
        await unlink(caminho);
      } catch (erro: any) {
        if (erro?.code !== 'ENOENT') {
          this.logger.warn(
            `Não foi possível apagar ${caminho}: ${erro?.message}`,
          );
        }
      }
    }
  }
}
