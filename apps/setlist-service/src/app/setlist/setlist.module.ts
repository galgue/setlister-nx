import { Module } from '@nestjs/common';
import { PrismaModule } from '../../db/db.module';
import { MusicApiModule } from '../../services/music-api/musicapi.module';
import { SetlistFmApiModule } from '../../services/setlist-fm-api/setlist-fm-api.module';
import { SetlistController } from './setlist.controller';
import { SetlistService } from './setlist.service';
@Module({
  imports: [SetlistFmApiModule, MusicApiModule, PrismaModule],
  providers: [SetlistService],
  controllers: [SetlistController],
})
export class SetlistModule {}
