import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { GetArtistSetlistsResponseDto } from './dtos/get-artist-setlists-response.dto';
import { SearchArtistResponseDto } from './dtos/search-artist-response.dto';
import {
  SetlistProcessDataType,
  SetlistProcessType,
} from './setlist-fm-api.consumers';
import dayjs from 'dayjs';
import { GetArtistResponseDto } from './dtos/get-artist-response.dto';

@Injectable()
export class SetlistFmApiService {
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

    return await new Promise<T>((resolve, reject) => {
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
    const data = await this.getFromCacheOrRunQueue<SearchArtistResponseDto>(
      `search-artist:${search}`,
      'searchArtist',
      {
        search,
      } as SetlistProcessDataType<'searchArtist'>,
      {
        priority: 1,
        ttl: 300000,
      }
    );

    return data.artist;
  }

  async getArtistSetlists(mbid: string, priority: 'sync' | 'async' = 'sync') {
    const data =
      await this.getFromCacheOrRunQueue<GetArtistSetlistsResponseDto>(
        `artist-setlists:${mbid}`,
        'getArtistSetlists',
        {
          mbid,
          page: 1,
        } as SetlistProcessDataType<'getArtistSetlists'>,
        {
          priority: priority === 'sync' ? 1 : 2,
          ttl: (result) => {
            const today = dayjs();
            const nextShow = result.setlist
              .filter((setlist) =>
                dayjs(setlist.eventDate, 'DD-MM-YYYY').isAfter(today)
              )
              .sort((a, b) =>
                dayjs(a.eventDate, 'DD-MM-YYYY').diff(
                  dayjs(b.eventDate, 'DD-MM-YYYY')
                )
              )[0];
            return nextShow
              ? dayjs(nextShow.eventDate, 'DD-MM-YYYY').diff(today)
              : 7 * 24 * 60 * 60 * 1000; // 7 days
          },
        }
      );

    const first10PastShows = data.setlist
      .filter(
        (setlist) =>
          dayjs(setlist.eventDate, 'DD-MM-YYYY').isBefore(dayjs()) &&
          setlist.sets.set.length > 0
      )
      .slice(0, 10);

    return first10PastShows;
  }

  async getArtist(mbid: string) {
    return this.getFromCacheOrRunQueue<GetArtistResponseDto>(
      `artist:${mbid}`,
      'getArtist',
      {
        mbid,
      } as SetlistProcessDataType<'getArtist'>,
      {
        priority: 1,
        ttl: 300000,
      }
    );
  }
}
