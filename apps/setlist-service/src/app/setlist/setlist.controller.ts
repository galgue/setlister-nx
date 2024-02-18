import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { Request as RequestType } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SetlistService } from './setlist.service';

@Controller('setlist')
export class SetlistController {
  constructor(private readonly setlistService: SetlistService) {}

  @UseGuards(JwtAuthGuard)
  @Get('artist/search')
  calculateSetlist(@Query('search') search: string) {
    return this.setlistService.searchArtist(search);
  }

  @UseGuards(JwtAuthGuard)
  @Get('artist/setlists')
  getArtistSetlists(@Query('mbid') mbid: string, @Request() req: RequestType) {
    return this.setlistService.getArtistSetlist(req.user, mbid);
  }
}
