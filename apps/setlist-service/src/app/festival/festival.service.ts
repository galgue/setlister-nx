import { Injectable } from '@nestjs/common';
import { JambaseApiService } from '../../services/jambase-api/jambase-api.service';
import { PrismaService } from '../../db/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class FestivalService {
  constructor(
    private readonly jambaseApiService: JambaseApiService,
    private readonly prismaService: PrismaService
  ) {}

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
}
