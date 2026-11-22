import { describe, expect, it, jest } from '@jest/globals';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { Cart } from '../../../domain/cart.aggregate';
import type { CartIdentity } from '../../../domain/cart-identity';
import type { ICartsRepository } from '../../../domain/carts.repository';
import { RemoveCartItemCommand } from './remove-cart-item.command';
import { RemoveCartItemHandler } from './remove-cart-item.handler';

const GUEST_TOKEN = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const identity: CartIdentity = { guestToken: GUEST_TOKEN };

const setup = (cart: Cart | null) => {
  const findByIdentity = jest
    .fn<ICartsRepository['findByIdentity']>()
    .mockResolvedValue(cart);
  const create = jest.fn<ICartsRepository['create']>((value) =>
    Promise.resolve(value),
  );
  const update = jest.fn<ICartsRepository['update']>((value) =>
    Promise.resolve(value),
  );
  const run = jest.fn<IUnitOfWork['run']>((work) => work());
  const handler = new RemoveCartItemHandler(
    { findByIdentity, create, update },
    { run } as unknown as IUnitOfWork,
  );

  return { handler, create, update, run };
};

describe('RemoveCartItemHandler', () => {
  it('removes the requested item from the stored cart', async () => {
    const cart = Cart.create(identity);
    cart.addItem(PRODUCT_ID, 2);
    const { handler, update, run } = setup(cart);

    const result = await handler.execute(
      new RemoveCartItemCommand(identity, PRODUCT_ID),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].getItems()).toEqual([]);
    expect(result.id).toBe(cart.getId());
  });

  it('creates an empty cart when no cart exists yet', async () => {
    const { handler, create } = setup(null);

    await handler.execute(new RemoveCartItemCommand(identity, PRODUCT_ID));

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].getItems()).toEqual([]);
  });
});
