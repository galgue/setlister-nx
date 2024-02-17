import { Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { SetlistFmHttpService } from './setlist-fm-http.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: async (configService: ConfigService<EnvConfig>) => ({
        baseURL: 'https://api.setlist.fm/rest/1.0/',
        headers: {
          'x-api-key': configService.get('SETLIST_FM_API_KEY'),
          Accept: 'application/json',
        },
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: SetlistFmHttpService,
      useExisting: HttpService,
    },
  ],
  exports: [SetlistFmHttpService],
})
export class SetlistFmHttpModule {}
