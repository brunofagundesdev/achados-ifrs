import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Quem entrega e o proprio responsavel logado (vem do token, nao do body).
export class CreateRetiradaDto {
  @IsInt()
  objetoId: number;

  // Pessoa que esta retirando o objeto
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  retiradoPorNome: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  retiradoPorDocumento?: string;

  // Se omitida, usa a data/hora atual.
  @IsOptional()
  @IsDateString()
  dataRetirada?: string;
}
