import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { firstValueFrom } from 'rxjs';
import { SearchArtistResponseDto } from './dtos/search-artist-response.dto';
import { GetArtistSetlistsResponseDto } from './dtos/get-artist-setlists-response.dto';
import { SetlistFmHttpService } from './setlist-fm-http/setlist-fm-http.service';
import { GetArtistResponseDto } from './dtos/get-artist-response.dto';

type ProcessToType = {
  searchArtist: { search: string };
  getArtistSetlists: { mbid: string; page: number };
  getArtist: { mbid: string };
};

export type SetlistProcessType = keyof ProcessToType;

export type SetlistProcessDataType<T extends keyof ProcessToType> =
  ProcessToType[T];

@Processor('setlist')
export class SetlistFmApiConsumer {
  constructor(private readonly setlistApiService: SetlistFmHttpService) {}
  @Process('searchArtist')
  async searchArtist(job: Job<SetlistProcessDataType<'searchArtist'>>) {
    const observable = this.setlistApiService.get<SearchArtistResponseDto>(
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
    const observable = this.setlistApiService.get<GetArtistSetlistsResponseDto>(
      `artist/${job.data.mbid}/setlists?p=${job.data.page}`
    );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error getting artist setlists');
    }

    return response.data;
  }

  @Process('getArtist')
  async getArtist(job: Job<SetlistProcessDataType<'getArtist'>>) {
    const observable = this.setlistApiService.get<GetArtistResponseDto>(
      `artist/${job.data.mbid}`
    );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error getting artist');
    }

    return response.data;
  }
}
