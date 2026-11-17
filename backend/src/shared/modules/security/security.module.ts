import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { RATE_LIMIT_STORE } from './rate-limit-store.port';
import { RedisRateLimitStore } from './redis-rate-limit-store.adapter';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        signOptions: { expiresIn: config.getOrThrow('JWT_ACCESS_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [
    AuthGuard,
    PermissionsGuard,
    SuperAdminGuard,
    RateLimitGuard,
    { provide: RATE_LIMIT_STORE, useClass: RedisRateLimitStore },
  ],
  exports: [
    AuthGuard,
    PermissionsGuard,
    SuperAdminGuard,
    RateLimitGuard,
    RATE_LIMIT_STORE,
    JwtModule,
  ],
})
export class SecurityModule {}
