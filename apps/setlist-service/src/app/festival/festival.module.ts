import { Module } from '@nestjs/common';
import { FestivalService } from './festival.service';
import { FestivalController } from './festival.controller';
import { PrismaModule } from '../../db/db.module';
import { JambaseApiModule } from '../../services/jambase-api/jambase-api.module';

@Module({
  providers: [FestivalService],
  controllers: [FestivalController],
  imports: [PrismaModule, JambaseApiModule],
})
export class FestivalModule {}
