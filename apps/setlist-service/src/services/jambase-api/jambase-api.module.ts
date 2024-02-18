import {
  BullModule,
  BullModuleOptions,
  Processor as ProcessorBull,
} from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { JambaseFmApiConsumer } from './jambase-api.consumer';
import { JambaseApiService } from './jambase-api.service';
import { JambaseHttpModule } from './jambase-http/jambase-http.module';

const queues = [
  {
    name: 'jambase',
    limiter: {
      max: 1,
      duration: 1000,
    },
  },
] as const satisfies readonly BullModuleOptions[];

type QueueName = (typeof queues)[number]['name'];

export function Processor(key: QueueName) {
  return ProcessorBull(key);
}
@Module({
  imports: [BullModule.registerQueue(...queues), JambaseHttpModule],
  providers: [JambaseApiService, JambaseFmApiConsumer],
  exports: [JambaseApiService],
})
export class JambaseApiModule {}
