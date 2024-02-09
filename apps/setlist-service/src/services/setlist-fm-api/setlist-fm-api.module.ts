import { Module } from '@nestjs/common';
import { SetlistFmApiService } from './setlist-fm-api.service';

@Module({
  providers: [SetlistFmApiService],
  exports: [SetlistFmApiService],
})
export class SetlistFmApiModule {}
