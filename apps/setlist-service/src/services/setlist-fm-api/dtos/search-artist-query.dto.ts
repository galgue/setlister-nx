import { IsNotEmpty, IsString } from 'class-validator';

export class SearchArtistQueryDto {
  @IsNotEmpty()
  @IsString()
  search: string;
}
