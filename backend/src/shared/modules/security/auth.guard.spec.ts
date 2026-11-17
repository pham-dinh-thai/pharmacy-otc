import { describe, expect, it, jest } from '@jest/globals';
import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { type AccessTokenPayload } from '../../../modules/authentication/application/ports/sign-token.port';
import { ALLOW_PASSWORD_CHANGE_REQUIRED } from './allow-password-change-required.decorator';
import { AuthGuard } from './auth.guard';

const handler = () => undefined;
const controller = class TestController {};

const contextWith = (
  token?: string,
): { context: ExecutionContext; request: Record<string, unknown> } => {
  const request = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };

  return {
    request,
    context: {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext,
  };
};

type Verify = (
  token: string,
  options: { secret: string },
) => Promise<AccessTokenPayload>;
type GetAllAndOverride = (
  key: string | symbol,
  targets: unknown[],
) => boolean | undefined;

const setup = (
  payload: Partial<AccessTokenPayload>,
  allowPasswordChangeRequired?: boolean,
) => {
  const verify = jest.fn<Verify>().mockResolvedValue({
    sub: 'actor-1',
    email: 'actor@example.com',
    mustChangePassword: false,
    ...payload,
  });
  const getAllAndOverride = jest
    .fn<GetAllAndOverride>()
    .mockReturnValue(allowPasswordChangeRequired);

  const guard = new AuthGuard(
    { verifyAsync: verify } as unknown as JwtService,
    {
      getOrThrow: jest.fn(() => 'test-secret'),
    } as unknown as ConfigService,
    { getAllAndOverride } as unknown as Reflector,
  );

  return { guard, verify, getAllAndOverride };
};

describe('AuthGuard', () => {
  it('rejects a request without an access token', async () => {
    const { guard, verify } = setup({});

    await expect(
      guard.canActivate(contextWith().context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects an invalid access token', async () => {
    const verify = jest.fn<Verify>().mockRejectedValue(new Error('bad token'));
    const brokenGuard = new AuthGuard(
      { verifyAsync: verify } as unknown as JwtService,
      {
        getOrThrow: jest.fn(() => 'test-secret'),
      } as unknown as ConfigService,
      {
        getAllAndOverride: jest.fn<GetAllAndOverride>(),
      } as unknown as Reflector,
    );

    await expect(
      brokenGuard.canActivate(contextWith('bad').context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a normal authenticated request', async () => {
    const { guard, getAllAndOverride } = setup({ mustChangePassword: false });

    await expect(guard.canActivate(contextWith('valid').context)).resolves.toBe(
      true,
    );
    expect(getAllAndOverride).toHaveBeenCalledWith(
      ALLOW_PASSWORD_CHANGE_REQUIRED,
      [handler, controller],
    );
  });

  it('blocks business endpoints when a password change is required', async () => {
    const { guard } = setup({ mustChangePassword: true });

    await expect(
      guard.canActivate(contextWith('valid').context),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows endpoints marked as password-change-safe', async () => {
    const { guard } = setup({ mustChangePassword: true }, true);
    const { context, request } = contextWith('valid');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request['user']).toMatchObject({
      sub: 'actor-1',
      mustChangePassword: true,
    });
  });
});
