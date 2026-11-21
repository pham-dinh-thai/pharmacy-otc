import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../application/ports/sign-token.port';

const ACCESS_EXPIRES_IN = 'JWT_ACCESS_EXPIRES_IN';
const REFRESH_EXPIRES_IN = 'JWT_REFRESH_EXPIRES_IN';

@Injectable()
export class JwtSignTokenAdapter {
  public constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  public async signAccessToken(
    accessTokenPayload: AccessTokenPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(accessTokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        ACCESS_EXPIRES_IN,
      ) as StringValue,
    });
  }

  public async sign(
    accessTokenPayload: AccessTokenPayload,
    refreshTokenPayload: RefreshTokenPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.signAccessToken(accessTokenPayload);

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        REFRESH_EXPIRES_IN,
      ) as StringValue,
    });

    return { accessToken, refreshToken };
  }
}
