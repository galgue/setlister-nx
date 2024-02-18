import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FestivalService } from './festival.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('festival')
export class FestivalController {
  constructor(private readonly festivalService: FestivalService) {}

  @UseGuards(JwtAuthGuard)
  @Get('artist/calculate')
  getArtistFestival(@Query('artistId') artistId: number) {
    return this.festivalService.calculateArtistFestival(artistId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('artist')
  getArtistFestivals(@Query('artistId') artistId: number) {
    return this.festivalService.getArtistFestival(artistId);
  }
}
