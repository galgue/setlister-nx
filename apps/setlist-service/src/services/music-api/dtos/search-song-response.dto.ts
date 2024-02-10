export class SearchSongResponseDto {
  results: SearchSongResult[];
}

class SearchSongResult {
  id: string;
  type: string;
  track: Song;
}

class Song {
  name: string;
  imageUrl: string;
  previewUrl?: string;
  isrc?: string;
  duration?: number;
  id: string;
  entryId?: string;
  album?: Album;
  artists?: Artist[];
}

class Album {
  id: string;
  name: string;
  totalItems: number;
  artists: Artist[];
}

class Artist {
  id: string;
  name: string;
}
