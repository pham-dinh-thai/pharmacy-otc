import { describe, expect, it, jest } from '@jest/globals';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { CartIdentityResolver } from './cart-identity.resolver';

const GUEST_TOKEN = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';

const setup = () => {
  const verifyAsync = jest
    .fn<JwtService['verifyAsync']>()
    .mockResolvedValue({ sub: USER_ID });
  const resolver = new CartIdentityResolver(
    { verifyAsync } as unknown as JwtService,
    { getOrThrow: () => 'secret' } as unknown as ConfigService,
  );

  return { resolver, verifyAsync };
};

const response = () => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
});

describe('CartIdentityResolver', () => {
  it('issues a guest cookie when there is no identity', async () => {
    const { resolver } = setup();
    const res = response();

    const identity = await resolver.resolve(
      { headers: {}, cookies: {} } as unknown as Request,
      res as unknown as Response,
    );

    expect(identity.guestToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.cookie).toHaveBeenCalledWith(
      'cart_id',
      identity.guestToken,
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('uses only the user identity and drops the guest cookie', async () => {
    const { resolver } = setup();
    const res = response();

    const identity = await resolver.resolve(
      {
        headers: { authorization: 'Bearer token' },
        cookies: { cart_id: GUEST_TOKEN },
      } as unknown as Request,
      res as unknown as Response,
    );

    expect(identity).toEqual({ userId: USER_ID });
    expect(res.clearCookie).toHaveBeenCalledWith('cart_id', { path: '/' });
  });
});
