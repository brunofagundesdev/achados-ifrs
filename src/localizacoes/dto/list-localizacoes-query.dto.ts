import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { TipoLocalizacao } from '../../generated/prisma/client.js';

export class ListLocalizacoesQueryDto {
  @IsOptional()
  @IsEnum(TipoLocalizacao)
  tipo?: TipoLocalizacao;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  paiId?: number;
}
