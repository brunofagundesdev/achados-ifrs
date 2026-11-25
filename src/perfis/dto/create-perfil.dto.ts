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

  // Opcional: so um ADMINISTRADOR pode criar perfil para outra pessoa.
  // Sem este campo, o perfil e criado para o proprio usuario logado.
  @IsOptional()
  @IsInt()
  usuarioId?: number;
}
