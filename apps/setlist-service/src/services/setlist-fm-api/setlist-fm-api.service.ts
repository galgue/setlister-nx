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
import { SetlistSetlistFmDto } from './dtos/setlist-setlist-fm.dto';

@Injectable()
export class SetlistFmApiService {
  constructor(
    @InjectQueue('setlist') private readonly setlistQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  private async runQueueJob<T>(
    queueName: SetlistProcessType,
    queueData: SetlistProcessDataType<typeof queueName>,
    options: { priority: number }
  ) {
    const thisJob = await this.setlistQueue.add(queueName, queueData, {
      priority: options.priority,
    });

    return await new Promise<T>((resolve, reject) => {
      this.setlistQueue.on('completed', async (job, result: T) => {
        if (job.id === thisJob.id) {
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

    return await this.runQueueJob<T>(queueName, queueData, {
      priority: options.priority,
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
    const data = await this.runQueueJob<GetArtistSetlistsResponseDto>(
      'getArtistSetlists',
      {
        mbid,
        page: 1,
      } as SetlistProcessDataType<'getArtistSetlists'>,
      {
        priority: priority === 'sync' ? 1 : 2,
      }
    );

    const nextShow = data.setlist
      .filter((setlist) =>
        dayjs(setlist.eventDate, 'DD-MM-YYYY').isAfter(dayjs())
      )
      .reduce((acc, setlist) => {
        if (acc === null) {
          return setlist;
        }

        if (
          dayjs(setlist.eventDate, 'DD-MM-YYYY').isBefore(
            dayjs(acc.eventDate, 'DD-MM-YYYY')
          )
        ) {
          return setlist;
        }

        return acc;
      }, null as SetlistSetlistFmDto | null);

    const first10PastShows = data.setlist
      .filter(
        (setlist) =>
          dayjs(setlist.eventDate, 'DD-MM-YYYY').isBefore(dayjs()) &&
          setlist.sets.set.length > 0
      )
      .map((setlist) => ({
        ...setlist,
        sets: {
          set: setlist.sets.set.map((set) => ({
            ...set,
            song: set.song.filter((song) => !song.tape),
          })),
        },
      }))
      .slice(0, 10);

    return {
      first10PastShows,
      nextShow: nextShow?.eventDate
        ? dayjs(nextShow.eventDate, 'DD-MM-YYYY').toDate()
        : null,
    };
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
