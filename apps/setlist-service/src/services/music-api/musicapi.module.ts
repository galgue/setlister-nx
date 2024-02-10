import { Module } from '@nestjs/common';
import { MusicApiService } from './musicapi.service';
import { MusicApiHttpModule } from './musicapi-http/musicapi-http.module';

@Module({
  providers: [MusicApiService],
  imports: [MusicApiHttpModule],
  exports: [MusicApiService],
})
export class MusicApiModule {}
