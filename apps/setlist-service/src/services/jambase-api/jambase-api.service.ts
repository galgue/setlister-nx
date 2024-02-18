import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { SearchArtistFestivalsResponseDto } from './dtos/search-artist-festival-response';
import { ProcessDataType, ProcessType } from './jambase-api.consumer';

@Injectable()
export class JambaseApiService {
  constructor(@InjectQueue('jambase') private readonly jambaseQueue: Queue) {}

  private async runQueueJob<T>(
    queueName: ProcessType,
    queueData: ProcessDataType<typeof queueName>,
    { priority }: { priority: number } = { priority: 1 }
  ) {
    const thisJob = await this.jambaseQueue.add(queueName, queueData, {
      priority,
    });

    return await new Promise<T>((resolve, reject) => {
      this.jambaseQueue.on('completed', async (job, result: T) => {
        if (job.id === thisJob.id) {
          resolve(result);
        }
      });

      this.jambaseQueue.on('failed', (job, err) => {
        if (job.id === thisJob.id) {
          reject(err);
        }
      });
    });
  }

  async calculateArtistFestivals(search: string) {
    return await this.runQueueJob<SearchArtistFestivalsResponseDto>(
      'searchArtistFestival',
      { search }
    );
  }
}
