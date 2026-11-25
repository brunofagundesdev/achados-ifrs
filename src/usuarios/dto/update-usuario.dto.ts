// PartialType: copia o RegisterDto deixando todos os campos opcionais (PATCH).
import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from '../../auth/dto/auth.dto.js';

export class UpdateUsuarioDto extends PartialType(RegisterDto) {}
