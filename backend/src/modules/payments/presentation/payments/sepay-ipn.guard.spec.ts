import { describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SepayIpnGuard } from './sepay-ipn.guard';

const guardWithSecret = (secret: string): SepayIpnGuard =>
  new SepayIpnGuard({
    getOrThrow: jest.fn(() => secret),
  } as unknown as ConfigService);

const contextWithHeader = (header?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: header === undefined ? {} : { 'x-secret-key': header },
      }),
    }),
  }) as unknown as ExecutionContext;

describe('SepayIpnGuard', () => {
  it('allows a request with the configured secret key', () => {
    const guard = guardWithSecret('ipn-secret');

    expect(guard.canActivate(contextWithHeader('ipn-secret'))).toBe(true);
  });

  it('rejects a missing secret key', () => {
    const guard = guardWithSecret('ipn-secret');

    expect(() => guard.canActivate(contextWithHeader())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an incorrect secret key', () => {
    const guard = guardWithSecret('ipn-secret');

    expect(() => guard.canActivate(contextWithHeader('wrong-secret'))).toThrow(
      UnauthorizedException,
    );
  });
});
