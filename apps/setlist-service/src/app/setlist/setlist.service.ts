import { Injectable } from '@nestjs/common';
import { SetlistFmApiService } from '../../services/setlist-fm-api/setlist-fm-api.service';
import { MusicApiService } from '../../services/music-api/musicapi.service';
import { PrismaService } from '../../db/prisma.service';
import dayjs from 'dayjs';
import { User } from '../../auth/jwt.strategy';

type SongInfo = {
  songId: number;
  name: string;
  artist: string;
  platformName: string | null;
  imageUrl: string | null;
  album: string | null;
  previewUrl: string | null;
  platformId: string | null;
};

@Injectable()
export class SetlistService {
  constructor(
    private readonly setlistFmApiService: SetlistFmApiService,
    private readonly musicApi: MusicApiService,
    private readonly prismaService: PrismaService
  ) {}

  async searchArtist(search: string) {
    return this.setlistFmApiService.searchArtist(search);
  }

  async getArtistSetlist(user: User, setlistFmId: string) {
    await this.createArtist(setlistFmId);
    await this.calculateArtistSetlists(setlistFmId);
    const songs = await this.calculateSongsInfo(user, setlistFmId);

    return songs;
  }

  private async createArtist(setlistFmId: string) {
    const artist = await this.setlistFmApiService.getArtist(setlistFmId);
    await this.prismaService.artist.upsert({
      where: {
        setlistFmId,
      },
      update: {
        name: artist.name,
      },
      create: {
        setlistFmId,
        name: artist.name,
      },
    });
  }

  private async calculateArtistSetlists(setlistFmId: string) {
    const artist = await this.prismaService.artist.findUnique({
      where: {
        setlistFmId,
      },
    });

    if (!artist) {
      throw new Error('Artist not found');
    }

    if (!artist.nextShow || artist.nextShow < new Date()) {
      const { first10PastShows: setlistFmSetlists, nextShow } =
        await this.setlistFmApiService.getArtistSetlists(setlistFmId);

      const coverArtistsIdToName = setlistFmSetlists
        .flatMap((setlist) =>
          setlist.sets.set.flatMap((set) =>
            set.song
              .filter((song) => song.cover)
              .map((song) => ({
                id: song.cover.mbid,
                name: song.cover.name,
              }))
          )
        )
        .reduce((acc, artist) => {
          acc[artist.id] = artist.name;
          return acc;
        }, {} as Record<string, string>);

      await this.prismaService.artist.createMany({
        skipDuplicates: true,
        data: Object.entries(coverArtistsIdToName).map(
          ([setlistFmId, name]) => ({
            setlistFmId,
            name,
          })
        ),
      });

      const coverArtists = await this.prismaService.artist.findMany({
        where: {
          setlistFmId: {
            in: Object.keys(coverArtistsIdToName),
          },
        },
      });

      for (const setlist of setlistFmSetlists) {
        await this.prismaService.show.upsert({
          create: {
            date: dayjs(setlist.eventDate, 'DD-MM-YYYY').toDate(),
            artist: {
              connect: {
                id: artist.id,
              },
            },
            version: 0,
          },
          update: {},
          where: {
            artistId_date: {
              artistId: artist.id,
              date: dayjs(setlist.eventDate, 'DD-MM-YYYY').toDate(),
            },
          },
        });

        await this.prismaService.song.createMany({
          skipDuplicates: true,
          data: setlist.sets.set
            .flatMap((set) => set.song)
            .map((song) => ({
              name: song.name,
              artistId: song.cover
                ? coverArtists.find(
                    (artist) => artist.setlistFmId === song.cover.mbid
                  )?.id
                : artist.id,
            })),
        });

        const show = await this.prismaService.show.findUnique({
          where: {
            artistId_date: {
              artistId: artist.id,
              date: dayjs(setlist.eventDate, 'DD-MM-YYYY').toDate(),
            },
          },
        });

        const songs = await this.prismaService.song.findMany({
          where: {
            name: {
              in: setlist.sets.set.flatMap((set) =>
                set.song.map((song) => song.name)
              ),
            },
          },
        });

        await this.prismaService.showSong.createMany({
          data: songs.map((song) => ({
            showId: show.id,
            songId: song.id,
          })),
          skipDuplicates: true,
        });
      }

      await this.prismaService.artist.update({
        where: {
          id: artist.id,
        },
        data: {
          nextShow,
        },
      });
    }
  }

  private async getArtistTopSongs(setlistFmId: string) {
    return await this.prismaService.$queryRaw<SongInfo[]>`
    SELECT 
      s.id as songId, 
      s.name as name, 
      a.name as artist,
      ANY_VALUE(sp.platformName) as platformName,
      ANY_VALUE(sp.imageUrl) as imageUrl,
      ANY_VALUE(sp.album) as album,
      ANY_VALUE(sp.previewUrl) as previewUrl,
      ANY_VALUE(sp.platformId) as platformId
    FROM \`ShowSong\` ss
    JOIN \`Song\` s ON s.id = ss.songId
    JOIN (
      SELECT sh.id as showId, sh.artistId
      FROM \`Show\` sh
      JOIN \`Artist\` a ON a.id = sh.artistId
      WHERE a.setlistFmId = ${setlistFmId}
      LIMIT 10
    ) sh ON sh.showId = ss.showId
    JOIN \`Artist\` a ON a.id = s.artistId
    LEFT JOIN \`SongPlatform\` sp ON s.id = sp.songId
    GROUP BY s.name, a.id
    HAVING COUNT(*) > 3;
    `;
  }

  private async calculateSongsInfo(user: User, setlistFmId: string) {
    const songs = await this.getArtistTopSongs(setlistFmId);

    const songsThatNeedInfo = songs.filter((song) => !song.platformId);

    const songsWithTrack = await Promise.all(
      songsThatNeedInfo.map(async (song) => {
        const info = await this.musicApi.searchSong(
          user.userUUID,
          song.artist,
          song.name
        );
        return {
          ...song,
          info,
        };
      })
    );

    this.prismaService.songPlatform.createMany({
      data: songsWithTrack.map((song) => ({
        songId: song.songId,
        platformId: song.info.track.id,
        platformName: user.platform,
        imageUrl: song.info.track.imageUrl,
        album: song.info.track.album?.name,
        previewUrl: song.info.track.previewUrl,
      })),
    });

    const songsWithInfo = songs.map((song) => {
      if (song.platformId) {
        return song;
      }
      const songExtraInfo = songsWithTrack.find(
        (s) => s.songId === song.songId
      );
      return {
        ...song,
        platformId: songExtraInfo?.info.track.id,
        platformName: user.platform,
        imageUrl: songExtraInfo?.info.track.imageUrl,
        album: songExtraInfo?.info.track.album?.name,
        previewUrl: songExtraInfo?.info.track.previewUrl,
      };
    });

    return songsWithInfo;
  }
}
