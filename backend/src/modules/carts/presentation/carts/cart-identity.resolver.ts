import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import type { AccessTokenPayload } from '../../../authentication/application/ports/sign-token.port';
import type { CartIdentity } from '../../domain/cart-identity';

export const CART_COOKIE = 'cart_id';
export const CART_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CartIdentityResolver {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async resolve(
    request: Request,
    response: Response,
  ): Promise<CartIdentity> {
    const userId = await this.readUserId(request);
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const rawGuestToken = cookies?.[CART_COOKIE];
    const guestToken =
      typeof rawGuestToken === 'string' && UUID_PATTERN.test(rawGuestToken)
        ? rawGuestToken
        : undefined;

    if (userId) {
      if (guestToken) {
        response.clearCookie(CART_COOKIE, { path: '/' });
      }
      return { userId };
    }

    if (guestToken) return { guestToken };

    const token = randomUUID();
    response.cookie(CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: CART_COOKIE_MAX_AGE * 1000,
    });

    return { guestToken: token };
  }

  private async readUserId(request: Request): Promise<string | undefined> {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (!token || type !== 'Bearer') return undefined;

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        },
      );

      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
