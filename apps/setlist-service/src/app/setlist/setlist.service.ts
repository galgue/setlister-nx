import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { ArtistSetlistFmDto } from './dtos/artist-setlist-fm.dto';
import { SetlistSetlistFmDto } from './dtos/setlist-setlist-fm.dto';
import {
  SetlistProcessDataType,
  SetlistProcessType,
} from './setlist.consumers';

@Injectable()
export class SetlistService {
  constructor(
    @InjectQueue('setlist') private readonly setlistQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  private async getFromCacheOrRunQueue<T>(
    key: string,
    queueName: SetlistProcessType,
    queueData: SetlistProcessDataType<typeof queueName>,
    options: { priority: number; ttl: number | ((result: T) => number) }
  ) {
    const res = await this.cacheService.get<T>(key);

    if (res !== undefined) {
      return res;
    }

    const thisJob = await this.setlistQueue.add(queueName, queueData, {
      priority: options.priority,
    });

    return await new Promise((resolve, reject) => {
      this.setlistQueue.on('completed', async (job, result: T) => {
        if (job.id === thisJob.id) {
          this.cacheService.set(
            key,
            result,
            typeof options.ttl === 'function'
              ? options.ttl(result)
              : options.ttl
          );

          resolve(result);
        }
      });

      this.setlistQueue.on('failed', (job, err) => {
        if (job.id === thisJob.id) {
          reject(err);
        }
      });
    });
  }

  async searchArtist(search: string) {
    return this.getFromCacheOrRunQueue<ArtistSetlistFmDto[]>(
      `search-artist:${search}`,
      'searchArtist',
      {
        search,
      } as SetlistProcessDataType<'searchArtist'>,
      {
        priority: 2,
        ttl: 300000,
      }
    );
  }

  async getArtistSetlists(mbid: string, page: number) {
    return this.getFromCacheOrRunQueue<SetlistSetlistFmDto>(
      `artist-setlists:${mbid}:${page}`,
      'getArtistSetlists',
      {
        mbid,
        page,
      } as SetlistProcessDataType<'getArtistSetlists'>,
      {
        priority: 2,
        ttl: 300000,
      }
    );
  }
}
