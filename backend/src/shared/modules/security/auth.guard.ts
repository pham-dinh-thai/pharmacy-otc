import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { type AccessTokenPayload } from '../../../modules/authentication/application/ports/sign-token.port';
import { ALLOW_PASSWORD_CHANGE_REQUIRED } from './allow-password-change-required.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    request['user'] = payload;

    const allowed = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PASSWORD_CHANGE_REQUIRED,
      [context.getHandler(), context.getClass()],
    );

    if (!allowed && payload.mustChangePassword === true) {
      throw new ForbiddenException('Password change required');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
