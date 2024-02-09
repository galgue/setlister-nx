import {
  BullModule,
  BullModuleOptions,
  InjectQueue as InjectQueueBull,
  Processor as ProcessorBull,
} from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SetlistFmHttpModule } from './setlist-fm-http/setlist-fm-http.module';
import { SetlistConsumer } from './setlist.consumers';
import { SetlistController } from './setlist.controller';
import { SetlistService } from './setlist.service';

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
  providers: [SetlistService, SetlistConsumer],
  controllers: [SetlistController],
})
export class SetlistModule {}
