import { describe, expect, it, jest } from '@jest/globals';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import type { StorefrontProduct } from '../../../../storefront/application/storefront.read-model';
import type { ICartCatalog } from '../../ports/cart-catalog.port';
import type { ICartsRepository } from '../../../domain/carts.repository';
import { AddCartItemsCommand } from './add-cart-items.command';
import { AddCartItemsHandler } from './add-cart-items.handler';

const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const OTHER_PRODUCT_ID = 'e7e6a5b4-3c2d-4f19-8a0b-1c2d3e4f5a6e';

const setup = (products: string[]) => {
  const cart = {
    addItem: jest.fn(),
    getId: () => 'cart-id',
    getItems: () => [{ getQuantity: () => 5 }],
  };
  const findByIdentity = jest
    .fn<ICartsRepository['findByIdentity']>()
    .mockResolvedValue(cart as never);
  const create = jest.fn<ICartsRepository['create']>((value) =>
    Promise.resolve(value),
  );
  const update = jest.fn<ICartsRepository['update']>((value) =>
    Promise.resolve(value),
  );
  const findProducts = jest
    .fn<ICartCatalog['findProducts']>()
    .mockResolvedValue(
      new Map(products.map((id) => [id, { id } as StorefrontProduct] as const)),
    );
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new AddCartItemsHandler(
    { findByIdentity, create, update },
    { findProducts } as unknown as ICartCatalog,
    { run } as unknown as IUnitOfWork,
  );

  return { handler, cart, findByIdentity, create, update, findProducts, run };
};

describe('AddCartItemsHandler', () => {
  it('adds every purchased line to the cart in one transaction', async () => {
    const { handler, cart, findProducts, update, run } = setup([
      PRODUCT_ID,
      OTHER_PRODUCT_ID,
    ]);

    await expect(
      handler.execute(
        new AddCartItemsCommand({ userId: 'user-id' }, [
          { productId: PRODUCT_ID, quantity: 2 },
          { productId: OTHER_PRODUCT_ID, quantity: 3 },
        ]),
      ),
    ).resolves.toEqual({ id: 'cart-id', totalItems: 5 });

    expect(run).toHaveBeenCalledTimes(1);
    expect(findProducts).toHaveBeenCalledWith([PRODUCT_ID, OTHER_PRODUCT_ID]);
    expect(cart.addItem).toHaveBeenNthCalledWith(1, PRODUCT_ID, 2);
    expect(cart.addItem).toHaveBeenNthCalledWith(2, OTHER_PRODUCT_ID, 3);
    expect(update).toHaveBeenCalledWith(cart as never);
  });

  it('rejects the whole batch when a product is missing', async () => {
    const { handler, cart, update } = setup([PRODUCT_ID]);

    await expect(
      handler.execute(
        new AddCartItemsCommand({ userId: 'user-id' }, [
          { productId: PRODUCT_ID, quantity: 2 },
          { productId: OTHER_PRODUCT_ID, quantity: 3 },
        ]),
      ),
    ).rejects.toThrow();
    expect(cart.addItem).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
