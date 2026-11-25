import { IsUrl } from 'class-validator';

export class CreateFotoDto {
  @IsUrl({ require_tld: false })
  url: string;
}
