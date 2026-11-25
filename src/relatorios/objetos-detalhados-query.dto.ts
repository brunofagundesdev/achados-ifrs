import { IsEnum, IsOptional } from 'class-validator';
import { StatusObjeto } from '../generated/prisma/client.js';

export class ObjetosDetalhadosQueryDto {
  @IsOptional()
  @IsEnum(StatusObjeto)
  status?: StatusObjeto;
}
