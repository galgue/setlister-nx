import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetArtistSetlistsQueryDto {
  @IsNotEmpty()
  @IsString()
  mbid: string;

  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @IsPositive()
  page: number = 1;
}
