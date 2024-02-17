import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserIntegrationResponseDto } from '../services/music-api/dtos/user-integration-response.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: 'secret', // TODO: move to env
    });
  }

  async validate(payload: UserIntegrationResponseDto) {
    return {
      userUUID: payload.integrationUser.uuid,
      platform: payload.integration.type,
      ...payload.integrationUser,
    };
  }

  private static extractJWT(req: Request): string | null {
    if (
      req.cookies &&
      'Authorization' in req.cookies &&
      req.cookies.Authorization.length > 0
    ) {
      return req.cookies.Authorization;
    }
    return null;
  }
}

export type User = {
  userUUID: typeof UserIntegrationResponseDto.prototype.integrationUser.uuid;
  platform: typeof UserIntegrationResponseDto.prototype.integration.type;
} & UserIntegrationResponseDto['integrationUser'];

declare module 'express' {
  interface Request {
    user: User;
  }
}
