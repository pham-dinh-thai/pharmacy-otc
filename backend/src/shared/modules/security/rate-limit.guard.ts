import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { RATE_LIMIT_KEY, type RateLimitOptions } from './rate-limit.decorator';
import {
  RATE_LIMIT_STORE,
  type IRateLimitStore,
} from './rate-limit-store.port';

/**
 * Fixed-window rate limiter. Mỗi key đếm số request theo danh tính (email,
 * actor hoặc IP) trong một cửa sổ thời gian, hết hạn tự động qua TTL.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    @Inject(RATE_LIMIT_STORE)
    private readonly store: IRateLimitStore,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const route =
      options.keyPrefix ??
      `${context.getClass().name}:${context.getHandler().name}`;
    const key = `rate:${route}:${this.identityOf(request, options.keyBy)}`;

    const count = await this.store.increment(key, options.windowSeconds);

    if (count > options.points) {
      throw new HttpException(
        'Too many requests. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private identityOf(
    request: Request & { user?: { sub?: string } },
    keyBy: RateLimitOptions['keyBy'],
  ): string {
    if (keyBy === 'email') {
      const email = (request.body as { email?: unknown } | undefined)?.email;

      if (typeof email === 'string' && email.trim()) {
        return `email:${email.trim().toLowerCase().slice(0, 255)}`;
      }
    }

    if (keyBy === 'actor' && request.user?.sub) {
      return `actor:${request.user.sub}`;
    }

    return `ip:${request.ip ?? 'unknown'}`;
  }
}
