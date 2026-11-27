import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { StatusObjeto } from '../../generated/prisma/client.js';

export class ListObjetosQueryDto {
  @IsOptional()
  @IsEnum(StatusObjeto)
  status?: StatusObjeto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoriaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  localizacaoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tagId?: number;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
