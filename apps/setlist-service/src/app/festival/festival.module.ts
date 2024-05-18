import { Module } from '@nestjs/common';
import { FestivalService } from './festival.service';
import { FestivalController } from './festival.controller';
import { PrismaModule } from '../../db/db.module';
import { JambaseApiModule } from '../../services/jambase-api/jambase-api.module';
import { SetlistFmApiModule } from '../../services/setlist-fm-api/setlist-fm-api.module';
import { SetlistModule } from '../setlist/setlist.module';
import { FestivalCalculationProgressModule } from '../services/festival-calculation-progress/festival-calculation-progress.module';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { FestivalConsumer } from './festival.consumer';
import { MusicApiModule } from '../../services/music-api/musicapi.module';

const queues = [
  {
    name: 'festival',
  },
] as const satisfies readonly BullModuleOptions[];
@Module({
  providers: [FestivalService, FestivalConsumer],
  controllers: [FestivalController],
  imports: [
    PrismaModule,
    JambaseApiModule,
    SetlistFmApiModule,
    SetlistModule,
    FestivalCalculationProgressModule,
    MusicApiModule,
    BullModule.registerQueue(...queues),
  ],
})
export class FestivalModule {}
