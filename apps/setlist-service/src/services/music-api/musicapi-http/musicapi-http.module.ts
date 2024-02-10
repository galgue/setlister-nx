import { Module } from '@nestjs/common';
import { MusicapiHttpService } from './musicapi-http.service';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
  providers: [
    {
      provide: MusicapiHttpService,
      useExisting: HttpService,
    },
  ],
  imports: [
    HttpModule.registerAsync({
      imports: [],
      useFactory: async () => ({
        baseURL: 'https://api.musicapi.com/',
        headers: {
          Authorization:
            'DevToken eyJhbGciOiJFUzI1NiIsImtpZCI6IjMzMTE4OTRkNDkifQ.eyJpc3MiOiIyY2Y4MmRiMy00MDY0LTQyMzUtODI1My0xNjk5NGViNTE3NzMiLCJpYXQiOjE3MDc0OTQwOTUuMjMyLCJleHAiOjE3MDg3MDM2OTUuMjMyfQ.0Z2LV06zXL1_R0bmQBbrcYQ4ez5ubi1UkczIQRdeHqsycdSl8p598nDg0614c1cuakscNABtPN6_CXGhFKcwSw', //TODO: move to env
          Accept: 'application/json',
        },
      }),
      inject: [],
    }),
  ],
  exports: [MusicapiHttpService],
})
export class MusicApiHttpModule {}
