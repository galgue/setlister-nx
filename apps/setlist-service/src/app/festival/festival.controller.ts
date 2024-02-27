import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FestivalService } from './festival.service';
import { Request as RequestType } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('festival')
export class FestivalController {
  constructor(private readonly festivalService: FestivalService) {}

  @Post('artist/:artistId/calculate')
  getArtistFestival(@Param('artistId') artistId: number) {
    return this.festivalService.calculateArtistFestival(artistId);
  }

  @Get('artist/:artistId')
  getArtistFestivals(@Param('artistId') artistId: number) {
    return this.festivalService.getArtistFestival(artistId);
  }

  @Get(':festivalId')
  async getFestival(@Param('festivalId') festivalId: number) {
    const festival = await this.festivalService.getFestival(festivalId);

    if (!festival) {
      throw new BadRequestException('Festival not found');
    }

    return festival;
  }

  @Get()
  getFestivals() {
    return this.festivalService.getFestivals();
  }

  @Post(':festivalId/info/calculate')
  async calculateFestival(@Param('festivalId') festivalId: number) {
    return this.festivalService.triggerCalculateFestivalInfo(festivalId);
  }

  @Post(':festivalId/setlist/calculate')
  async calculateFestivalSetlist(
    @Param('festivalId') festivalId: number,
    @Request() req: RequestType
  ) {
    return this.festivalService.triggerCalculateFestivalArtistsSetlists(
      req.user,
      festivalId
    );
  }

  @Get(':festivalId/setlist')
  getFestivalSetlist(
    @Param('festivalId') festivalId: number,
    @Request() req: RequestType
  ) {
    return this.festivalService.getFestivalSetlist(
      festivalId,
      req.user.platform
    );
  }
}
