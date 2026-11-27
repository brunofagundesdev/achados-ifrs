import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { StatusObjeto } from '../../generated/prisma/client.js';
import { CreateObjetoPerdidoDto } from './create-objeto.dto.js';

class CamposAtualizaveisDto extends OmitType(
  PartialType(CreateObjetoPerdidoDto),
  ['fotoUrls'] as const,
) {}

export class UpdateObjetoDto extends CamposAtualizaveisDto {
  @IsOptional()
  @IsIn([StatusObjeto.PERDIDO, StatusObjeto.ENCONTRADO], {
    message:
      'status deve ser PERDIDO ou ENCONTRADO (DEVOLVIDO só é definido ao registrar a retirada)',
  })
  status?: StatusObjeto;
}
