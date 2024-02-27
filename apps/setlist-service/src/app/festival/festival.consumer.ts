import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { User } from '../../auth/jwt.strategy';
import { FestivalService } from './festival.service';

type ProcessToType = {
  calculateFestival: {
    festivalId: number;
  };
  calculateFestivalArtistsSetlists: {
    festivalId: number;
    user: User;
  };
};

export type MusicapiSpotifyProcessType = keyof ProcessToType;

export type MusicapiSpotifyProcessDataType<T extends keyof ProcessToType> =
  ProcessToType[T];

@Processor('festival')
export class FestivalConsumer {
  constructor(private readonly festivalService: FestivalService) {}
  @Process('calculateFestival')
  async calculateFestival({
    data,
  }: Job<MusicapiSpotifyProcessDataType<'calculateFestival'>>) {
    this.festivalService.calculateFestivalInfo(data.festivalId);
  }

  @Process('calculateFestivalArtistsSetlists')
  async calculateFestivalArtistsSetlists({
    data,
  }: Job<MusicapiSpotifyProcessDataType<'calculateFestivalArtistsSetlists'>>) {
    const festival = await this.festivalService.getFestival(data.festivalId);
    if (!festival) {
      return;
    }
    await this.festivalService.calculateFestivalSetlistsSongs(
      data.user,
      data.festivalId
    );
  }
}
