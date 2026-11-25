import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { StatusObjeto } from '../../generated/prisma/client.js';

// Filtros de busca (RF06): GET /objetos?status=ENCONTRADO&categoriaId=2&busca=garrafa
export class ListObjetosQueryDto {
  @IsOptional()
  @IsEnum(StatusObjeto)
  status?: StatusObjeto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoriaId?: number;

  // Inclui as sublocalizacoes: filtrar por um predio traz os objetos das salas dele.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  localizacaoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tagId?: number;

  // Parte do "tipo" do objeto (ex.: "garrafa")
  @IsOptional()
  @IsString()
  tipo?: string;

  // Procura no tipo OU na descricao
  @IsOptional()
  @IsString()
  busca?: string;

  // Formato AAAA-MM-DD
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
