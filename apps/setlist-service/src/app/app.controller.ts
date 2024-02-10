import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { AppService } from './app.service';
import { AuthService } from '../auth/auth.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService
  ) {}

  @Post('login')
  async getData(
    @Body('authModelUUID') authModelUUID: string,
    @Res({
      passthrough: true,
    })
    response: Response
  ) {
    if (!authModelUUID)
      throw new HttpException(
        'authModelUUID is required in body',
        HttpStatus.BAD_REQUEST
      );
    const auth = await this.authService.login(authModelUUID);

    response.cookie('Authorization', auth.access_token, {
      httpOnly: true,
      // expires in a week
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return auth;
  }
}
