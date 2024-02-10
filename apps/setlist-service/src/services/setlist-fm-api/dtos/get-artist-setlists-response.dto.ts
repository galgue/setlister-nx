import { SetlistSetlistFmDto } from './setlist-setlist-fm.dto';

export class GetArtistSetlistsResponseDto {
  itemsPerPage: number;
  page: number;
  total: number;
  setlist: SetlistSetlistFmDto[];
}
