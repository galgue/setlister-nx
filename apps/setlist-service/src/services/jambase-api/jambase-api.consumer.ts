import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { firstValueFrom } from 'rxjs';
import { JambaseHttpService } from './jambase-http/jambase-http.service';
import { SearchArtistFestivalsResponseDto } from './dtos/search-artist-festival-response';

type ProcessToType = {
  searchArtistFestival: { search: string };
};

export type ProcessType = keyof ProcessToType;

export type ProcessDataType<T extends keyof ProcessToType> = ProcessToType[T];

@Processor('jambase')
export class JambaseFmApiConsumer {
  constructor(private readonly jambaseHttpApiService: JambaseHttpService) {}
  @Process('searchArtistFestival')
  async searchArtistFestival(
    job: Job<ProcessDataType<'searchArtistFestival'>>
  ) {
    const uriParams = new URLSearchParams();
    uriParams.append('eventType', 'festival');
    uriParams.append('artistName', job.data.search);
    const observable =
      this.jambaseHttpApiService.get<SearchArtistFestivalsResponseDto>(
        `events?${uriParams.toString()}`
      );

    const response = await firstValueFrom(observable);

    if (response.status !== 200) {
      throw new Error('Error searching artist');
    }

    return response.data;
  }
}
