import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoLocalizacao } from '../../generated/prisma/client.js';

export class CreateLocalizacaoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nome: string;

  @IsEnum(TipoLocalizacao)
  tipo: TipoLocalizacao;

  // CAMPUS nao tem pai; PREDIO, ANDAR e SALA precisam do nivel logo acima.
  @IsOptional()
  @IsInt()
  paiId?: number;
}
