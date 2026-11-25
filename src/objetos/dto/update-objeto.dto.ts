import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { StatusObjeto } from '../../generated/prisma/client.js';
import { CreateObjetoPerdidoDto } from './create-objeto.dto.js';

// Tudo opcional (PATCH). As fotos tem rotas proprias (/objetos/:id/fotos).
class CamposAtualizaveisDto extends OmitType(
  PartialType(CreateObjetoPerdidoDto),
  ['fotoUrls'] as const,
) {}

export class UpdateObjetoDto extends CamposAtualizaveisDto {
  // DEVOLVIDO nao pode ser definido aqui: so a retirada (POST /retiradas) devolve um objeto.
  @IsOptional()
  @IsIn([StatusObjeto.PERDIDO, StatusObjeto.ENCONTRADO], {
    message:
      'status deve ser PERDIDO ou ENCONTRADO (DEVOLVIDO só é definido ao registrar a retirada)',
  })
  status?: StatusObjeto;
}
