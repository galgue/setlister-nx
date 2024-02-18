import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FestivalService } from './festival.service';

@Controller('festival')
export class FestivalController {
  constructor(private readonly festivalService: FestivalService) {}

  @UseGuards(JwtAuthGuard)
  @Get('artist/calculate/:artistId')
  getArtistFestival(@Param('artistId') artistId: number) {
    return this.festivalService.calculateArtistFestival(artistId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('artist/:artistId')
  getArtistFestivals(@Param('artistId') artistId: number) {
    return this.festivalService.getArtistFestival(artistId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':festivalId')
  getFestival(@Param('festivalId') festivalId: number) {
    return this.festivalService.getFestival(festivalId);
  }
}
