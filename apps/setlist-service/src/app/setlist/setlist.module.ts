import { Module } from '@nestjs/common';
import { SetlistFmApiModule } from '../../services/setlist-fm-api/setlist-fm-api.module';
import { SetlistController } from './setlist.controller';
import { SetlistService } from './setlist.service';
import { MusicApiModule } from '../../services/music-api/musicapi.module';
@Module({
  imports: [SetlistFmApiModule, MusicApiModule],
  providers: [SetlistService],
  controllers: [SetlistController],
})
export class SetlistModule {}
