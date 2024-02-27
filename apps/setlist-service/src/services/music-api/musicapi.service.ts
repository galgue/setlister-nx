import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { SearchSongResponseDto } from './dtos/search-song-response.dto';
import { UserIntegrationResponseDto } from './dtos/user-integration-response.dto';
import { MusicapiHttpService } from './musicapi-http/musicapi-http.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  MusicapiSpotifyProcessDataType,
  MusicapiSpotifyProcessType,
} from './musicapi-spotify.consumer';
import { User } from '../../auth/jwt.strategy';

@Injectable()
export class MusicApiService {
  constructor(
    private readonly musicapiHttpService: MusicapiHttpService,
    @InjectQueue('musicapi-spotify') private readonly spotifyQueue: Queue
  ) {}

  private async runQueueJob<T>(
    queueName: MusicapiSpotifyProcessType,
    queueData: MusicapiSpotifyProcessDataType<typeof queueName>,
    options: { priority: number } = { priority: 1 }
  ) {
    const thisJob = await this.spotifyQueue.add(queueName, queueData, {
      priority: options.priority,
    });

    return await new Promise<T>((resolve, reject) => {
      this.spotifyQueue.on('completed', async (job, result: T) => {
        if (job.id === thisJob.id) {
          resolve(result);
        }
      });

      this.spotifyQueue.on('failed', (job, err) => {
        if (job.id === thisJob.id) {
          reject(err);
        }
      });
    });
  }

  private async getSearchSongResponse(
    user: User,
    artist: string,
    song: string
  ): Promise<SearchSongResponseDto> {
    const uri = `api/${user.uuid}/search`;
    const data = {
      type: 'track',
      track: song,
      artist,
    };
    if (user.platform === 'spotify') {
      return this.runQueueJob<SearchSongResponseDto>('request', {
        data,
        userUUID: user.uuid,
        method: 'POST',
        url: uri,
      });
    }
    const observable = this.musicapiHttpService.post<SearchSongResponseDto>(
      uri,
      data
    );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error searching song');
    }

    return response.data;
  }

  async searchSong(user: User, artist: string, song: string) {
    const response = await this.getSearchSongResponse(user, artist, song);

    if (response.results.length === 0) {
      throw new Error('Song not found');
    }

    const songsWithFullName = response.results.filter(
      (songItem) => songItem.track.name === song
    );

    return songsWithFullName.at(0) || response.results.at(0);
  }

  async getUserIntegration(authModelUUID: string) {
    const observable = this.musicapiHttpService.get<UserIntegrationResponseDto>(
      `app/integrations/${authModelUUID}`
    );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error getting user');
    }

    return response.data;
  }
}
