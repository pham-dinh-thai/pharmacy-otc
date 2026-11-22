import { describe, expect, it, jest } from '@jest/globals';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { Cart } from '../../../domain/cart.aggregate';
import type { CartIdentity } from '../../../domain/cart-identity';
import type { ICartsRepository } from '../../../domain/carts.repository';
import { CartItemNotFoundException } from '../../../domain/exceptions/cart.exceptions';
import { SetCartItemQuantityCommand } from './set-cart-item-quantity.command';
import { SetCartItemQuantityHandler } from './set-cart-item-quantity.handler';

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
  const handler = new SetCartItemQuantityHandler(
    { findByIdentity, create, update },
    { run } as unknown as IUnitOfWork,
  );

  return { handler, findByIdentity, create, update, run };
};

describe('SetCartItemQuantityHandler', () => {
  it('updates the quantity of an existing item', async () => {
    const cart = Cart.create(identity);
    cart.addItem(PRODUCT_ID, 1);
    const { handler, update } = setup(cart);

    await handler.execute(
      new SetCartItemQuantityCommand(identity, PRODUCT_ID, 4),
    );

    expect(update.mock.calls[0][0].getItems()[0].getQuantity()).toBe(4);
  });

  it('removes the item when the quantity is zero', async () => {
    const cart = Cart.create(identity);
    cart.addItem(PRODUCT_ID, 2);
    const { handler, update } = setup(cart);

    await handler.execute(
      new SetCartItemQuantityCommand(identity, PRODUCT_ID, 0),
    );

    expect(update.mock.calls[0][0].getItems()).toEqual([]);
  });

  it('rejects missing items without persisting', async () => {
    const { handler, create, update } = setup(Cart.create(identity));

    await expect(
      handler.execute(new SetCartItemQuantityCommand(identity, PRODUCT_ID, 1)),
    ).rejects.toThrow(CartItemNotFoundException);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('creates a cart when the identity has no stored cart', async () => {
    const { handler, create, run } = setup(null);

    const result = await handler.execute(
      new SetCartItemQuantityCommand(identity, PRODUCT_ID, 0),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(create.mock.calls[0][0].getId());
  });
});
