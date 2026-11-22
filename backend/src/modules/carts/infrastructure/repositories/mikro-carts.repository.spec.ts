import { describe, expect, it, jest } from '@jest/globals';
import { EntityManager, LockMode } from '@mikro-orm/core';
import { Cart } from '../../domain/cart.aggregate';
import { MikroCart } from '../entities/mikro-cart.entity';
import { MikroCartItem } from '../entities/mikro-cart-item.entity';
import { MikroCartsRepository } from './mikro-carts.repository';

const CART_ID = '33333333-3333-4333-8333-333333333333';
const ITEM_ID = '44444444-4444-4444-8444-444444444444';
const GUEST_TOKEN = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';

const persistentCart = (): MikroCart =>
  Object.assign(new MikroCart(), {
    id: CART_ID,
    userId: null,
    guestToken: GUEST_TOKEN,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const persistentItem = (): MikroCartItem =>
  Object.assign(new MikroCartItem(), {
    id: ITEM_ID,
    cartId: CART_ID,
    productId: PRODUCT_ID,
    quantity: 2,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const setup = () => {
  const findOne = jest
    .fn<
      (entity: unknown, where: unknown, options?: unknown) => Promise<unknown>
    >()
    .mockResolvedValue(null);
  const find = jest
    .fn<
      (entity: unknown, where: unknown, options?: unknown) => Promise<unknown[]>
    >()
    .mockResolvedValue([]);
  const persist = jest.fn<(entity: unknown) => void>();
  const flush = jest.fn<() => Promise<void>>(() => Promise.resolve());
  const nativeDelete = jest
    .fn<(entity: unknown, where: unknown) => Promise<number>>()
    .mockResolvedValue(0);
  const insertMany = jest
    .fn<(entity: unknown, data: unknown) => Promise<unknown>>()
    .mockResolvedValue([]);
  const getReference = jest.fn<(entity: unknown, id: unknown) => MikroCart>(
    () => persistentCart(),
  );

  const repository = new MikroCartsRepository({
    findOne,
    find,
    persist,
    flush,
    nativeDelete,
    insertMany,
    getReference,
  } as unknown as EntityManager);

  return {
    repository,
    findOne,
    find,
    persist,
    flush,
    nativeDelete,
    insertMany,
    getReference,
  };
};

describe('MikroCartsRepository', () => {
  it('finds a guest cart by token and maps its items to an aggregate', async () => {
    const { repository, findOne, find } = setup();
    findOne.mockResolvedValue(persistentCart());
    find.mockResolvedValue([persistentItem()]);

    const cart = await repository.findByIdentity({ guestToken: GUEST_TOKEN });

    expect(findOne).toHaveBeenCalledWith(
      MikroCart,
      { guestToken: GUEST_TOKEN },
      { lockMode: undefined },
    );
    expect(find).toHaveBeenCalledWith(
      MikroCartItem,
      { cartId: CART_ID },
      {
        orderBy: { createdAt: 'asc', id: 'asc' },
        lockMode: undefined,
      },
    );
    expect(cart?.getId()).toBe(CART_ID);
    expect(cart?.getItems()[0].getProductId()).toBe(PRODUCT_ID);
    expect(cart?.getItems()[0].getQuantity()).toBe(2);
  });

  it('prefers the user identity and locks rows when requested', async () => {
    const { repository, findOne } = setup();

    await repository.findByIdentity(
      { userId: USER_ID, guestToken: GUEST_TOKEN },
      { forUpdate: true },
    );

    expect(findOne).toHaveBeenCalledWith(
      MikroCart,
      { userId: USER_ID },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });

  it('returns null when no cart exists', async () => {
    const { repository } = setup();

    await expect(
      repository.findByIdentity({ guestToken: GUEST_TOKEN }),
    ).resolves.toBeNull();
  });

  it('persists a new cart and replaces its items', async () => {
    const { repository, persist, flush, nativeDelete, insertMany } = setup();
    const cart = Cart.create({ guestToken: GUEST_TOKEN });
    cart.addItem(PRODUCT_ID, 1);

    await repository.create(cart);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledTimes(1);
    expect(nativeDelete).toHaveBeenCalledWith(MikroCartItem, {
      cartId: cart.getId(),
    });
    expect(insertMany).toHaveBeenCalledWith(MikroCartItem, [
      expect.objectContaining({
        cartId: cart.getId(),
        productId: PRODUCT_ID,
        quantity: 1,
      }),
    ]);
  });

  it('updates an existing cart and clears its items on an empty cart', async () => {
    const { repository, getReference, nativeDelete, insertMany, flush } =
      setup();
    const cart = Cart.create({ userId: USER_ID });

    await repository.update(cart);

    expect(getReference).toHaveBeenCalledWith(MikroCart, cart.getId());
    expect(nativeDelete).toHaveBeenCalledWith(MikroCartItem, {
      cartId: cart.getId(),
    });
    expect(insertMany).not.toHaveBeenCalled();
    expect(flush).toHaveBeenCalledTimes(1);
  });
});
