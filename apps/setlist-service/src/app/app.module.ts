import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SetlistModule } from './setlist/setlist.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envValidation } from './envValidation';
import { FestivalModule } from './festival/festival.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate(schema) {
        return envValidation.parse(schema);
      },
    }),
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig>) => ({
        redis: {
          host: configService.get('REDIS_URL'),
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<EnvConfig>) => ({
        store: await redisStore({
          socket: {
            host: configService.get('REDIS_URL'),
            port: configService.get('REDIS_PORT'),
          },
        }),
      }),
    }),
    SetlistModule,
    AuthModule,
    FestivalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
