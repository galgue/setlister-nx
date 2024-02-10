import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { GetArtistSetlistsQueryDto } from '../../services/setlist-fm-api/dtos/get-artist-setlists-query.dto';
import { SearchArtistQueryDto } from '../../services/setlist-fm-api/dtos/search-artist-query.dto';
import { SetlistService } from './setlist.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Request as RequestType } from 'express';

@Controller('setlist')
export class SetlistController {
  constructor(private readonly setlistService: SetlistService) {}

  @UseGuards(JwtAuthGuard)
  @Get('artist/search')
  calculateSetlist(@Query() query: SearchArtistQueryDto) {
    return this.setlistService.searchArtist(query.search);
  }

  @UseGuards(JwtAuthGuard)
  @Get('artist/setlists')
  getArtistSetlists(
    @Query() query: GetArtistSetlistsQueryDto,
    @Request() req: RequestType
  ) {
    console.log(req.user);
    return this.setlistService.getArtistSetlist(req.user.userUUID, query.mbid);
  }
}
