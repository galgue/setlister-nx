import { IsNotEmpty, IsString } from 'class-validator';

export class GetArtistSetlistsQueryDto {
  @IsNotEmpty()
  @IsString()
  mbid: string;
}
