import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePerfilDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  matricula?: string;

  @IsOptional()
  @IsInt()
  usuarioId?: number;
}
