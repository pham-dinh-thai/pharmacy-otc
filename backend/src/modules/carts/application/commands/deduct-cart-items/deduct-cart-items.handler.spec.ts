import { describe, expect, it, jest } from '@jest/globals';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { Cart } from '../../../domain/cart.aggregate';
import type { CartIdentity } from '../../../domain/cart-identity';
import type { ICartsRepository } from '../../../domain/carts.repository';
import { DeductCartItemsCommand } from './deduct-cart-items.command';
import { DeductCartItemsHandler } from './deduct-cart-items.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const OTHER_PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fd';
const identity: CartIdentity = { userId: USER_ID };

const buildCart = (): Cart => {
  const cart = Cart.create(identity);
  cart.addItem(PRODUCT_ID, 2);
  cart.addItem(OTHER_PRODUCT_ID, 3);

  return cart;
};

const setup = (cart: Cart | null) => {
  const findByIdentity = jest
    .fn<ICartsRepository['findByIdentity']>()
    .mockResolvedValue(cart);
  const update = jest.fn<ICartsRepository['update']>((value) =>
    Promise.resolve(value),
  );
  const run = jest.fn<IUnitOfWork['run']>((work) => work());
  const handler = new DeductCartItemsHandler(
    { findByIdentity, update } as unknown as ICartsRepository,
    { run } as unknown as IUnitOfWork,
  );

  return { handler, findByIdentity, update, run };
};

const items = (cart: Cart): [string, number][] =>
  cart.getItems().map((item) => [item.getProductId(), item.getQuantity()]);

describe('DeductCartItemsHandler', () => {
  it('deducts only the purchased quantities and keeps other items', async () => {
    const cart = buildCart();
    const { handler, findByIdentity, update, run } = setup(cart);

    const result = await handler.execute(
      new DeductCartItemsCommand(identity, [
        { productId: PRODUCT_ID, quantity: 1 },
      ]),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(findByIdentity).toHaveBeenCalledWith(identity, { forUpdate: true });
    expect(update).toHaveBeenCalledWith(cart);
    expect(items(cart)).toEqual([
      [PRODUCT_ID, 1],
      [OTHER_PRODUCT_ID, 3],
    ]);
    expect(result).toEqual({ changed: true });
  });

  it('removes a cart item when its whole quantity was purchased', async () => {
    const cart = buildCart();
    const { handler } = setup(cart);

    await handler.execute(
      new DeductCartItemsCommand(identity, [
        { productId: PRODUCT_ID, quantity: 2 },
      ]),
    );

    expect(items(cart)).toEqual([[OTHER_PRODUCT_ID, 3]]);
  });

  it('does not write when the cart is absent or has no matching item', async () => {
    const missingCart = setup(null);
    await expect(
      missingCart.handler.execute(
        new DeductCartItemsCommand(identity, [
          { productId: PRODUCT_ID, quantity: 1 },
        ]),
      ),
    ).resolves.toEqual({ changed: false });
    expect(missingCart.update).not.toHaveBeenCalled();

    const cart = buildCart();
    const noMatch = setup(cart);
    await expect(
      noMatch.handler.execute(
        new DeductCartItemsCommand(identity, [
          { productId: 'unknown-product', quantity: 1 },
        ]),
      ),
    ).resolves.toEqual({ changed: false });
    expect(noMatch.update).not.toHaveBeenCalled();
    expect(items(cart)).toEqual([
      [PRODUCT_ID, 2],
      [OTHER_PRODUCT_ID, 3],
    ]);
  });

  it('skips the lookup when there is nothing to deduct', async () => {
    const { handler, findByIdentity, update } = setup(null);

    await handler.execute(new DeductCartItemsCommand(identity, []));

    expect(findByIdentity).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
