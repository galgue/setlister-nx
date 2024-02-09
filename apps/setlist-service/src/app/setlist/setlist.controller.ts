import { Controller, Get, Query } from '@nestjs/common';
import { SearchArtistQueryDto } from './dtos/search-artist-query.dto';
import { SetlistService } from './setlist.service';
import { GetArtistSetlistsQueryDto } from './dtos/get-artist-setlists-query.dto';

@Controller('setlist')
export class SetlistController {
  constructor(private readonly setlistService: SetlistService) {}

  @Get('search/artist')
  calculateSetlist(@Query() query: SearchArtistQueryDto) {
    return this.setlistService.searchArtist(query.search);
  }

  @Get('artist/setlists')
  getArtistSetlists(@Query() query: GetArtistSetlistsQueryDto) {
    return this.setlistService.getArtistSetlists(query.mbid, query.page);
  }
}
