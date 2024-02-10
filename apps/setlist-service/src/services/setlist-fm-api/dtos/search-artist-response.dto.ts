import { ArtistSetlistFmDto } from './artist-setlist-fm.dto';

export class SearchArtistResponseDto {
  type: string;
  itemsPerPage: number;
  page: number;
  total: number;
  artist: ArtistSetlistFmDto[];
}
