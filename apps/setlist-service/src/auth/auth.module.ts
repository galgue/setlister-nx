import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MusicApiModule } from '../services/music-api/musicapi.module';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
  imports: [
    MusicApiModule,
    PassportModule,
    JwtModule.register({
      secret: 'secret', // TODO: move to env
      signOptions: { expiresIn: '60s' },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
