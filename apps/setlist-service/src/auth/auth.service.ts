import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserIntegrationResponseDto } from '../services/music-api/dtos/user-integration-response.dto';
import { MusicApiService } from '../services/music-api/musicapi.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly musicApiService: MusicApiService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(userUUID: string): Promise<UserIntegrationResponseDto> {
    try {
      const user = await this.musicApiService.getUserIntegration(userUUID);
      if (user) {
        return user;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async login(userUUID: string) {
    const user = await this.validateUser(userUUID);
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      access_token: this.jwtService.sign({
        ...user,
        uuid: userUUID,
      }),
    };
  }
}
