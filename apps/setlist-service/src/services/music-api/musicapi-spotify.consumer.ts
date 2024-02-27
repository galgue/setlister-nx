import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Observable, firstValueFrom } from 'rxjs';
import { MusicapiHttpService } from './musicapi-http/musicapi-http.service';
import { AxiosResponse } from 'axios';

type ProcessToType = {
  request: {
    url: string;
    method: 'GET' | 'POST';
    data?: unknown;
    userUUID: string;
  };

  calculateSong: {
    userUUID: string;
    songId: string;
  };
};

export type MusicapiSpotifyProcessType = keyof ProcessToType;

export type MusicapiSpotifyProcessDataType<T extends keyof ProcessToType> =
  ProcessToType[T];

@Processor('musicapi-spotify')
export class MusicapiSpotifyFmApiConsumer {
  constructor(private readonly musicapiHttpService: MusicapiHttpService) {}
  @Process('request')
  async request<T>(job: Job<MusicapiSpotifyProcessDataType<'request'>>) {
    console.log('Requesting', job.data.url, new Date().toISOString());
    let observable: Observable<AxiosResponse<T, unknown>>;
    if (job.data.method === 'GET') {
      observable = this.musicapiHttpService.get(job.data.url);
    }
    if (job.data.method === 'POST') {
      observable = this.musicapiHttpService.post(job.data.url, job.data.data);
    }

    const response = await firstValueFrom(observable);

    if (response.status === 429) {
      return new Promise<T>((resolve) => {
        setTimeout(() => {
          resolve(this.request(job));
        }, response.headers['retry-after'] * 1000);
      });
    }

    if (response.status !== 200) {
      throw new Error('Error in spotify request');
    }

    return response.data;
  }

  @Process('calculateSong')
  async calculateSong<T>(
    job: Job<MusicapiSpotifyProcessDataType<'calculateSong'>>
  ) {
    console.log('Calculating song', job.data.songId, new Date().toISOString());
    const uri = `api/${job.data.userUUID}/calculate-song`;
    const data = {
      songId: job.data.songId,
    };
    const observable = this.musicapiHttpService.post<T>(uri, data);

    const response = await firstValueFrom(observable);

    if (response.status === 429) {
      return new Promise<T>((resolve) => {
        setTimeout(() => {
          resolve(this.calculateSong(job));
        }, response.headers['retry-after'] * 1000);
      });
    }

    if (response.status !== 200) {
      throw new Error('Error calculating song');
    }

    return response.data;
  }
}
