import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { type IRateLimitStore } from './rate-limit-store.port';

@Injectable()
export class RedisRateLimitStore implements IRateLimitStore {
  public constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  public async increment(key: string, windowSeconds: number): Promise<number> {
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    return count;
  }
}
