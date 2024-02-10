import { Injectable } from '@nestjs/common';
import { SetlistFmApiService } from '../../services/setlist-fm-api/setlist-fm-api.service';
import { SetSetlistFmDto } from '../../services/setlist-fm-api/dtos/setlist-setlist-fm.dto';
import { MusicApiService } from '../../services/music-api/musicapi.service';

@Injectable()
export class SetlistService {
  constructor(
    private readonly setlistFmApiService: SetlistFmApiService,
    private readonly musicApi: MusicApiService
  ) {}

  async searchArtist(search: string) {
    return this.setlistFmApiService.searchArtist(search);
  }

  async getArtistSetlist(userUUID: string, mbid: string) {
    const artistSetlists = await this.setlistFmApiService.getArtistSetlists(
      mbid
    );

    const topPlayedSongs = artistSetlists.reduce(
      (acc, setlist) => {
        setlist.sets.set.forEach((set) => {
          set.song.forEach((song) => {
            const songName = song.name;

            if (acc[songName]) {
              acc[songName].count++;
            } else {
              acc[songName] = { song, count: 1 };
            }
          });
        });

        return acc;
      },
      {} as Record<
        string,
        {
          song: SetSetlistFmDto['song'][0];
          count: number;
        }
      >
    );

    const topSongs = Object.entries(topPlayedSongs)
      .filter(([, data]) => data.count > 3)
      .filter(([, data]) => !data.song.tape)
      .map(([, data]) => ({ ...data.song }));

    const artist = await this.setlistFmApiService.getArtist(mbid);

    const topSongsTracks = await Promise.all(
      topSongs.map(async (song) => {
        const track = await this.musicApi.searchSong(
          userUUID,
          song?.cover?.name ?? artist.name,
          song.name
        );

        return {
          ...song,
          track,
        };
      })
    );

    return topSongsTracks;
  }
}
