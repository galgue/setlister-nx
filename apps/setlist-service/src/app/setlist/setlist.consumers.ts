import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { firstValueFrom } from 'rxjs';
import { SetlistFmHttpService } from './setlist-fm-http/setlist-fm-http.service';

type ProcessToType = {
  searchArtist: { search: string };
  getArtistSetlists: { mbid: string; page: number };
};

export type SetlistProcessType = keyof ProcessToType;

export type SetlistProcessDataType<T extends keyof ProcessToType> =
  ProcessToType[T];

@Processor('setlist')
export class SetlistConsumer {
  constructor(private readonly setlistApiService: SetlistFmHttpService) {}
  @Process('searchArtist')
  async searchArtist(job: Job<SetlistProcessDataType<'searchArtist'>>) {
    const observable = this.setlistApiService.get(
      `search/artists?artistName=${job.data.search}&p=1&sort=relevance`
    );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error searching artist');
    }

    return response.data;
  }

  @Process('getArtistSetlists')
  async getArtistSetlists(
    job: Job<SetlistProcessDataType<'getArtistSetlists'>>
  ) {
    console.log(job.data);
    const observable = this.setlistApiService.get(
      `artist/${job.data.mbid}/setlists?p=${job.data.page}`
    );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error getting artist setlists');
    }

    return response.data;
  }
}
