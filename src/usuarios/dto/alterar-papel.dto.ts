import { IsEnum } from 'class-validator';
import { Papel } from '../../generated/prisma/client.js';

export class AlterarPapelDto {
  @IsEnum(Papel)
  papel: Papel;
}
