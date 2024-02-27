import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SetlistFmApiConsumer } from './setlist-fm-api.consumers';
import { SetlistFmApiService } from './setlist-fm-api.service';
import { SetlistFmHttpModule } from './setlist-fm-http/setlist-fm-http.module';

const queues = [
  {
    name: 'setlist',
    limiter: {
      max: 16,
      duration: 1000,
    },
  },
] as const satisfies readonly BullModuleOptions[];

@Module({
  imports: [BullModule.registerQueue(...queues), SetlistFmHttpModule],
  providers: [SetlistFmApiService, SetlistFmApiConsumer],
  exports: [SetlistFmApiService],
})
export class SetlistFmApiModule {}
