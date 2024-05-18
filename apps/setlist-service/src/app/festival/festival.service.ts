import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import dayjs from 'dayjs';
import { User } from '../../auth/jwt.strategy';
import { PrismaService } from '../../db/prisma.service';
import { JambaseApiService } from '../../services/jambase-api/jambase-api.service';
import { SetlistFmApiService } from '../../services/setlist-fm-api/setlist-fm-api.service';
import { SetlistService } from '../setlist/setlist.service';
import { IntegrationType } from '../../services/music-api/dtos/user-integration-response.dto';
import { MusicApiService } from '../../services/music-api/musicapi.service';

@Injectable()
export class FestivalService {
  constructor(
    private readonly jambaseApiService: JambaseApiService,
    private readonly prismaService: PrismaService,
    private readonly setlistFmApiService: SetlistFmApiService,
    private readonly setlistService: SetlistService,
    private readonly musicApiService: MusicApiService,
    @InjectQueue('festival') private readonly festivalQueue: Queue
  ) {}

  async getFestival(festivalId: number) {
    const festival = await this.prismaService.festival.findUnique({
      where: {
        id: festivalId,
      },
      include: {
        FestivalArtist: {
          include: {
            Artist: true,
          },
        },
      },
    });

    if (!festival) {
      return;
    }

    const { FestivalArtist, ...festivalInfo } = festival;

    return {
      ...festivalInfo,
      artists: FestivalArtist.map((fa) => fa.Artist),
    };
  }

  async getArtistFestival(artistId: number) {
    return await this.prismaService.festival.findMany({
      where: {
        FestivalArtist: {
          some: {
            artistId,
          },
        },
      },
    });
  }

  async getFestivalSetlist(festivalId: number, platform: IntegrationType) {
    const festival = await this.prismaService.festival.findUnique({
      where: {
        id: festivalId,
      },
      include: {
        FestivalArtist: {
          include: {
            Artist: true,
          },
        },
      },
    });

    if (!festival) {
      throw new Error('Festival not found');
    }

    const promises = await Promise.allSettled(
      festival.FestivalArtist.map(async (fa) => {
        const artist = fa.Artist;
        return await this.setlistService.getArtistSetlistSongs(
          artist.id,
          platform
        );
      })
    );

    return promises
      .map((p) => (p.status === 'fulfilled' ? p.value : []))
      .flat()
      .filter((s) => s.platformId !== null);
  }

  async calculateArtistFestival(artistId: number) {
    const artist = await this.prismaService.artist.findUnique({
      where: {
        id: artistId,
      },
    });
    const { events, success } =
      await this.jambaseApiService.calculateArtistFestivals(artist.name);

    if (!success) {
      return {
        success: false,
        message: 'No events found',
      };
    }

    const allArtists = new Set(
      events.flatMap((event) => event.performer.map((p) => p.name))
    );

    await this.prismaService.artist.createMany({
      skipDuplicates: true,
      data: Array.from(allArtists).map((artist) => ({
        name: artist,
      })),
    });

    await Promise.all(
      events.map(async (event) => {
        const festival = await this.prismaService.festival.upsert({
          where: {
            jambaseId: event.identifier,
          },
          update: {
            name: event.name,
            startDate: dayjs(event.startDate, 'YYYY-MM-DD').toDate(),
            endDate: dayjs(event.endDate, 'YYYY-MM-DD').toDate(),
            image: event.image,
            city: event.location.address.addressLocality,
            region: event.location.address.addressRegion.name,
            country: event.location.address.addressCountry.name,
          },
          create: {
            jambaseId: event.identifier,
            name: event.name,
            startDate: dayjs(event.startDate, 'YYYY-MM-DD').toDate(),
            endDate: dayjs(event.endDate, 'YYYY-MM-DD').toDate(),
            image: event.image,
            city: event.location.address.addressLocality,
            region: event.location.address.addressRegion.name,
            country: event.location.address.addressCountry.name,
          },
        });

        const festivalArtist = await this.prismaService.artist.findMany({
          where: {
            name: {
              in: event.performer.map((p) => p.name),
            },
          },
        });

        await this.prismaService.festivalArtist.createMany({
          skipDuplicates: true,
          data: festivalArtist.map((artist) => ({
            artistId: artist.id,
            festivalId: festival.id,
          })),
        });
      })
    );

    return {
      success: true,
    };
  }

  async getFestivals(page = 1, pageSize = 10) {
    return await this.prismaService.festival.findMany({
      orderBy: {
        startDate: 'asc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async getFestivalArtistsWithInfo(festivalId: number) {
    return await this.prismaService.festivalArtist.findMany({
      where: {
        festivalId,
        Artist: {
          setlistFmId: {
            not: null,
          },
        },
      },
      include: {
        Artist: true,
      },
    });
  }

  async triggerCalculateFestivalInfo(festivalId: number) {
    await this.festivalQueue.add('calculateFestival', {
      festivalId,
    });
  }

  async calculateFestivalInfo(festivalId: number) {
    const festivalWithArtists = await this.prismaService.festival.findUnique({
      where: {
        id: festivalId,
      },
      include: {
        FestivalArtist: {
          include: {
            Artist: true,
          },
        },
      },
    });

    if (!festivalWithArtists) {
      throw new Error('Festival not found');
    }

    if (!festivalWithArtists.FestivalArtist.length) {
      throw new Error('No artists found');
    }

    const artists = festivalWithArtists.FestivalArtist.map((fa) => fa.Artist);

    const results = await Promise.allSettled(
      artists.map(async (artist) => {
        let setlistFmId = artist.setlistFmId;
        if (!artist.setlistFmId) {
          const searchedArtists = await this.setlistFmApiService.searchArtist(
            artist.name,
            'async'
          );

          if (!searchedArtists) {
            return;
          }

          setlistFmId =
            searchedArtists.find((a) => a.name === artist.name)?.mbid ||
            searchedArtists[0].mbid;

          await this.prismaService.artist.update({
            where: {
              id: artist.id,
            },
            data: {
              setlistFmId,
            },
          });
        }
        await this.setlistService.calculateArtistSetlistsInfo(artist.id, false);
      })
    );

    return {
      success: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };
  }

  async calculateFestivalSetlistsSongs(user: User, festivalId: number) {
    const artists = await this.getFestivalArtistsWithInfo(festivalId);

    const result = (
      await Promise.all(
        artists.map(async (artist) => {
          try {
            // await this.festivalCalculationProgressService.addArtistProgress(
            //   festivalId,
            //   artist.Artist.id
            // );
            const result = await this.setlistService.calculateTopSongsInfo(
              user,
              artist.Artist.id
            );
            // await this.festivalCalculationProgressService.upsertArtistProgress(
            //   festivalId,
            //   artist.Artist.id,
            //   false
            // );
            console.log('calculate festival result', artist, result);
            return result;
          } catch (e) {
            console.error('calculate festival error', artist, e);
            // this.festivalCalculationProgressService.upsertArtistProgress(
            //   festivalId,
            //   artist.Artist.id,
            //   true
            // );
          }
        })
      )
    ).flat();

    return result;
  }

  async triggerCalculateFestivalArtistsSetlists(
    user: User,
    festivalId: number
  ) {
    // const festivalCalculation =
    //   await this.festivalCalculationProgressService.getProgress(festivalId);

    // if (festivalCalculation.inProgress > 0) {
    //   return festivalCalculation;
    // }

    // TODO: Add progress check
    await this.festivalQueue.add('calculateFestivalArtistsSetlists', {
      user,
      festivalId,
    });
  }

  async createFestivalPlaylist(user: User, festivalId: number) {
    const festival = await this.getFestival(festivalId);

    if (!festival) {
      throw new Error('Festival not found');
    }

    const festivalSetlist = (
      await this.getFestivalSetlist(festivalId, user.platform)
    ).map((s) => s.platformId);

    const { id } = await this.musicApiService.createPlaylist(
      user,
      festival.name
    );

    // will save it 100 at a time

    for (let i = 0; i < festivalSetlist.length; i += 10) {
      const batch = festivalSetlist.slice(i, i + 10);
      await this.musicApiService.addSongToPlaylist(user, id, batch);
    }

    return {
      id,
    };
  }
}
