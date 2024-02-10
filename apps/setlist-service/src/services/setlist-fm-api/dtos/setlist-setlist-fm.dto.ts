import { ArtistSetlistFmDto } from './artist-setlist-fm.dto';

export class SetlistSetlistFmDto {
  id: string;
  versionId: string;
  eventDate: string;
  lastUpdated: string;
  artist: ArtistSetlistFmDto;
  sets: {
    set: SetSetlistFmDto[];
  };
}

export class SetSetlistFmDto {
  name: string;
  encore: number;
  song: {
    name: string;
    tape: boolean;
    cover?: {
      name: string;
      mbid: string;
      disambiguation: string;
      url: string;
    };
  }[];
}
