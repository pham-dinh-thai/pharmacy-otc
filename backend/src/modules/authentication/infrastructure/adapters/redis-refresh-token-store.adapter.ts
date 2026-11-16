import { Injectable } from '@nestjs/common';
import { IRefreshTokenStorePort } from '../../application/ports/refresh-token-store.port';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisRefreshTokenStorePort implements IRefreshTokenStorePort {
  public constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  public async save(
    sub: string,
    jti: string,
    token: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(`refresh:${sub}:${jti}`, token, 'EX', ttlSeconds);
  }

  public async matches(
    sub: string,
    jti: string,
    refreshToken: string,
  ): Promise<boolean> {
    return (await this.redis.get(`refresh:${sub}:${jti}`)) === refreshToken;
  }

  public async revoke(sub: string, jti: string): Promise<void> {
    await this.redis.del(`refresh:${sub}:${jti}`);
  }

  public async revokeAll(sub: string): Promise<void> {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        `refresh:${sub}:*`,
        'COUNT',
        100,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }
}
