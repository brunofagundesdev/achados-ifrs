import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateObjetoEncontradoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  tipo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descricao: string;

  @IsInt()
  categoriaId: number;

  @IsInt()
  localizacaoId: number;

  @IsDateString()
  data: string;

  @IsOptional()
  @IsBoolean()
  sensivel?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  tagIds?: number[];

  @IsOptional()
  @IsArray()
  @IsUrl({ require_tld: false }, { each: true })
  fotoUrls?: string[];
}

export class CreateObjetoPerdidoDto extends CreateObjetoEncontradoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  contato: string;
}
