import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  // Guardada em minusculas e sem espacos nas pontas: "Preto " e "preto" sao a mesma tag.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nome: string;
}
