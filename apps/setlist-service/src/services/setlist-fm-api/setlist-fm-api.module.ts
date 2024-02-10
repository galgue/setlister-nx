import {
  BullModule,
  BullModuleOptions,
  InjectQueue as InjectQueueBull,
  Processor as ProcessorBull,
} from '@nestjs/bull';
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

type QueueName = (typeof queues)[number]['name'];

export function InjectQueue(key: QueueName) {
  return InjectQueueBull(key);
}

export function Processor(key: QueueName) {
  return ProcessorBull(key);
}
@Module({
  imports: [BullModule.registerQueue(...queues), SetlistFmHttpModule],
  providers: [SetlistFmApiService, SetlistFmApiConsumer],
  exports: [SetlistFmApiService],
})
export class SetlistFmApiModule {}
