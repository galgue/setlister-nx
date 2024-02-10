import { Injectable } from '@nestjs/common';
import { MusicapiHttpService } from './musicapi-http/musicapi-http.service';
import { firstValueFrom } from 'rxjs';
import { SearchSongResponseDto } from './dtos/search-song-response.dto';
import { UserResponseDto } from './dtos/user-response.dto';

@Injectable()
export class MusicApiService {
  constructor(private readonly musicapiHttpService: MusicapiHttpService) {}

  async searchSong(userUUID: string, artist: string, song: string) {
    const observable = this.musicapiHttpService.post<SearchSongResponseDto>(
      `api/${userUUID}/search`,
      {
        type: 'track',
        track: song,
        artist,
      }
    );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error searching song');
    }

    if (response.data.results.length === 0) {
      throw new Error('Song not found');
    }

    const songsWithFullName = response.data.results.filter(
      (songItem) => songItem.track.name === song
    );

    return songsWithFullName.at(0) || response.data.results.at(0);
  }

  async getUser(userUUID: string) {
    const observable = this.musicapiHttpService.get<UserResponseDto>(
      `api/${userUUID}/users/profile`
    );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error getting user');
    }

    return response.data;
  }
}
