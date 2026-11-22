import { describe, expect, it, jest } from '@jest/globals';
import { ProductNotFoundException } from '../../../../products/domain/exceptions/product.exceptions';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { Cart, MAX_CART_ITEMS } from '../../../domain/cart.aggregate';
import type { CartIdentity } from '../../../domain/cart-identity';
import { ICartsRepository } from '../../../domain/carts.repository';
import { CartLimitExceededException } from '../../../domain/exceptions/cart.exceptions';
import { ICartCatalog } from '../../ports/cart-catalog.port';
import { AddCartItemCommand } from './add-cart-item.command';
import { AddCartItemHandler } from './add-cart-item.handler';

const GUEST_TOKEN = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const identity: CartIdentity = { guestToken: GUEST_TOKEN };

type Product = Awaited<ReturnType<ICartCatalog['findProduct']>>;

const setup = (
  cart: Cart | null = null,
  product: Product = { id: PRODUCT_ID } as Product,
) => {
  const findByIdentity = jest
    .fn<ICartsRepository['findByIdentity']>()
    .mockResolvedValue(cart);
  const create = jest.fn<ICartsRepository['create']>((value) =>
    Promise.resolve(value),
  );
  const update = jest.fn<ICartsRepository['update']>((value) =>
    Promise.resolve(value),
  );
  const findProduct = jest
    .fn<ICartCatalog['findProduct']>()
    .mockResolvedValue(product);
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new AddCartItemHandler(
    {
      findByIdentity,
      create,
      update,
    },
    { findProduct, findProducts: jest.fn<ICartCatalog['findProducts']>() },
    { run } as unknown as IUnitOfWork,
  );

  return { handler, findByIdentity, create, update, findProduct, run };
};

describe('AddCartItemHandler', () => {
  it('creates the cart and adds the item inside a unit of work', async () => {
    const { handler, findByIdentity, create, update, findProduct, run } =
      setup();

    const result = await handler.execute(
      new AddCartItemCommand(identity, PRODUCT_ID, 2),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(findByIdentity).toHaveBeenCalledWith(identity, { forUpdate: true });
    expect(findProduct).toHaveBeenCalledWith(PRODUCT_ID);
    expect(create).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();

    const cart = create.mock.calls[0][0];

    expect(cart.getId()).toBe(result.id);
    expect(cart.getItems()[0].getQuantity()).toBe(2);
  });

  it('updates an existing cart', async () => {
    const { handler, create, update } = setup(Cart.create(identity));

    await handler.execute(new AddCartItemCommand(identity, PRODUCT_ID, 1));

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].getItems()[0].getQuantity()).toBe(1);
  });

  it('rejects a product that is not in the catalog', async () => {
    const { handler, create, update } = setup(null, null);

    await expect(
      handler.execute(new AddCartItemCommand(identity, PRODUCT_ID, 1)),
    ).rejects.toThrow(ProductNotFoundException);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('does not persist a cart that exceeds the limit', async () => {
    const cart = Cart.create(identity);
    cart.addItem(PRODUCT_ID, MAX_CART_ITEMS);
    const { handler, create, update } = setup(cart);

    await expect(
      handler.execute(new AddCartItemCommand(identity, PRODUCT_ID, 1)),
    ).rejects.toThrow(CartLimitExceededException);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
