import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRetiradaDto } from './create-retirada.dto.js';

export class UpdateRetiradaDto extends PartialType(
  OmitType(CreateRetiradaDto, ['objetoId'] as const),
) {}
