import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRetiradaDto } from './create-retirada.dto.js';

// Serve para CORRIGIR dados digitados errado; o objeto da retirada nao muda.
export class UpdateRetiradaDto extends PartialType(
  OmitType(CreateRetiradaDto, ['objetoId'] as const),
) {}
