import { Module } from '@nestjs/common';
import { JambaseHttpService } from './jambase-http.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [
    {
      provide: JambaseHttpService,
      useExisting: HttpService,
    },
  ],
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<EnvConfig>) => ({
        baseURL: 'https://www.jambase.com/jb-api/v1/',
        headers: {
          Accept: 'application/json',
        },
        params: {
          apikey: configService.get('JAMBASE_API_KEY'),
        },
      }),
    }),
  ],
  exports: [JambaseHttpService],
})
export class JambaseHttpModule {}
