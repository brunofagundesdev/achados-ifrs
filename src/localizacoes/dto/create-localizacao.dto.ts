import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoLocalizacao } from '../../generated/prisma/client.js';

export class CreateLocalizacaoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nome: string;

  @IsEnum(TipoLocalizacao)
  tipo: TipoLocalizacao;

  @IsOptional()
  @IsInt()
  paiId?: number;
}
