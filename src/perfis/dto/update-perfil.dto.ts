import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePerfilDto } from './create-perfil.dto.js';

// Atualizacao parcial; o dono do perfil (usuarioId) nao muda.
export class UpdatePerfilDto extends PartialType(
  OmitType(CreatePerfilDto, ['usuarioId'] as const),
) {}
