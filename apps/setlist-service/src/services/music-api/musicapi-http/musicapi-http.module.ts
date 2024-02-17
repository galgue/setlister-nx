import { Module } from '@nestjs/common';
import { MusicapiHttpService } from './musicapi-http.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [
    {
      provide: MusicapiHttpService,
      useExisting: HttpService,
    },
  ],
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<EnvConfig>) => ({
        baseURL: 'https://api.musicapi.com/',
        headers: {
          Authorization: configService.get('MUSICAPI_API_KEY'),
          Accept: 'application/json',
        },
      }),
    }),
  ],
  exports: [MusicapiHttpService],
})
export class MusicApiHttpModule {}
