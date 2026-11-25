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

// Campos comuns aos dois cadastros (RF03 e RF04).
// Objeto ENCONTRADO: "data" = data de entrada no setor.
export class CreateObjetoEncontradoDto {
  // O que e o objeto: "Garrafa termica", "Calculadora"...
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

  // Pode ser qualquer nivel (campus, predio, andar ou sala).
  @IsInt()
  localizacaoId: number;

  @IsDateString()
  data: string;

  // Objeto sensivel (documentos, cartoes...): fotos ocultas nas consultas publicas (RF10).
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

// Objeto PERDIDO: igual ao encontrado, mas o contato do dono e obrigatorio.
// Objeto PERDIDO: "data" = data em que foi perdido.
export class CreateObjetoPerdidoDto extends CreateObjetoEncontradoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  contato: string;
}
