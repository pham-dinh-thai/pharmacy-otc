import { describe, expect, it, jest } from '@jest/globals';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { Checkout } from '../../../domain/checkout.aggregate';
import { CheckoutLine } from '../../../domain/checkout-line.entity';
import type { ICheckoutRepository } from '../../../domain/checkouts.repository';
import { CheckoutNotFoundException } from '../../../domain/exceptions/checkout.exception';
import { GetCheckoutHandler } from './get-checkout.handler';
import { GetCheckoutQuery } from './get-checkout.query';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';

const headers = { ...systemActorHeaders(), actorId: USER_ID };

const buildCheckout = (userId = USER_ID): Checkout =>
  Checkout.create({
    userId,
    lines: [
      CheckoutLine.create({
        productId: PRODUCT_ID,
        productName: 'Paracetamol 500mg',
        productSku: 'SKU-001',
        unitPrice: 25000n,
        quantity: 2,
      }),
    ],
    shippingName: 'Nguyen Van A',
    shippingAddress: '1 Nguyen Hue',
    shippingPhone: '0901234567',
  });

const setup = (checkout: Checkout | null = buildCheckout()) => {
  const findById = jest
    .fn<ICheckoutRepository['findById']>()
    .mockResolvedValue(checkout);
  const handler = new GetCheckoutHandler({
    findById,
  } as unknown as ICheckoutRepository);

  return { handler, findById };
};

describe('GetCheckoutHandler', () => {
  it('returns the checkout detail for its owner', async () => {
    const { handler, findById } = setup();

    const result = await handler.execute(
      new GetCheckoutQuery(CHECKOUT_ID, headers),
    );

    expect(findById).toHaveBeenCalledWith(CHECKOUT_ID);
    expect(result).toMatchObject({
      status: 'pending',
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      amount: '50000',
      lines: [
        {
          productId: PRODUCT_ID,
          productName: 'Paracetamol 500mg',
          productSku: 'SKU-001',
          unitPrice: '25000',
          quantity: 2,
          lineTotal: '50000',
        },
      ],
    });
    expect(result.expiresAt.getTime() - result.createdAt.getTime()).toBe(
      30 * 60 * 1000,
    );
  });

  it('rejects a checkout owned by another user', async () => {
    const { handler } = setup(buildCheckout('another-user'));

    await expect(
      handler.execute(new GetCheckoutQuery(CHECKOUT_ID, headers)),
    ).rejects.toBeInstanceOf(CheckoutNotFoundException);
  });

  it('rejects a missing checkout', async () => {
    const { handler } = setup(null);

    await expect(
      handler.execute(new GetCheckoutQuery(CHECKOUT_ID, headers)),
    ).rejects.toBeInstanceOf(CheckoutNotFoundException);
  });
});
