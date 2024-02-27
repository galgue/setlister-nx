import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as RequestType } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SetlistService } from './setlist.service';

@UseGuards(JwtAuthGuard)
@Controller('setlist')
export class SetlistController {
  constructor(private readonly setlistService: SetlistService) {}

  @Get('artist/search')
  calculateSetlist(@Query('search') search: string) {
    return this.setlistService.searchArtist(search);
  }

  @Post('artist/create')
  createArtist(@Query('setlistFmId') setlistFmId: string) {
    return this.setlistService.createArtist(setlistFmId);
  }

  @Post('artist/setlists')
  calculateArtistSetlists(
    @Query('id') id: number,
    @Request() req: RequestType
  ) {
    return this.setlistService.calculateArtistSetlistSongs(req.user, id);
  }
}
