import { Module } from '@nestjs/common';
import { MusicApiService } from './musicapi.service';
import { MusicApiHttpModule } from './musicapi-http/musicapi-http.module';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { MusicapiSpotifyFmApiConsumer } from './musicapi-spotify.consumer';

const queues = [
  {
    name: 'musicapi-spotify',
  },
] as const satisfies readonly BullModuleOptions[];

@Module({
  providers: [MusicApiService, MusicapiSpotifyFmApiConsumer],
  imports: [BullModule.registerQueue(...queues), MusicApiHttpModule],
  exports: [MusicApiService],
})
export class MusicApiModule {}
