import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRetiradaDto {
  @IsInt()
  objetoId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  retiradoPorNome: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  retiradoPorDocumento?: string;

  @IsOptional()
  @IsDateString()
  dataRetirada?: string;
}
