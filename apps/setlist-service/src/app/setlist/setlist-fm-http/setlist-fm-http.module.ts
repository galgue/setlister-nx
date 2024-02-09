import { Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { SetlistFmHttpService } from './setlist-fm-http.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [],
      useFactory: async () => ({
        baseURL: 'https://api.setlist.fm/rest/1.0/',
        headers: {
          'x-api-key': 'Y9PcUcNe3JzHwBin5TTh1mVqkuc-VPTjIBgj', //TODO: move to env
          Accept: 'application/json',
        },
      }),
      inject: [],
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
