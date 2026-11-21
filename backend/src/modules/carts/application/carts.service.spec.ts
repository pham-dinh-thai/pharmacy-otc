import { describe, expect, it, jest } from '@jest/globals';
import type { StorefrontService } from '../../storefront/application/storefront.service';
import type { StorefrontProduct } from '../../storefront/application/storefront.read-model';
import type {
  CartIdentity,
  CartRecord,
  ICartsRepository,
} from '../domain/carts.repository';
import { CartLimitExceededException } from '../domain/exceptions/cart.exceptions';
import { CartsService, MAX_CART_ITEMS } from './carts.service';

const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const GUEST_TOKEN = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';

const emptyCart: CartRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  userId: null,
  guestToken: GUEST_TOKEN,
  items: [],
};

function product(unitPrice = '25000'): StorefrontProduct {
  return {
    id: PRODUCT_ID,
    name: 'Panadol 500mg',
    sku: 'PAN-500',
    unit: 'hộp',
    unitPrice,
    imageUrl: null,
    description: null,
    warning: null,
    stockQuantity: 12,
    inStock: true,
    categories: [],
  };
}

const setup = (cart: CartRecord = emptyCart, unitPrice = '25000') => {
  const findByIdentity = jest
    .fn<ICartsRepository['findByIdentity']>()
    .mockResolvedValue(cart);
  const create = jest.fn<ICartsRepository['create']>().mockResolvedValue(cart);
  const saveItems = jest
    .fn<ICartsRepository['saveItems']>()
    .mockResolvedValue();
  const getProduct = jest
    .fn<StorefrontService['getProduct']>()
    .mockResolvedValue(product(unitPrice));

  const service = new CartsService(
    {
      findByIdentity,
      create,
      saveItems,
      delete: jest.fn<ICartsRepository['delete']>(),
    },
    { getProduct } as unknown as StorefrontService,
  );

  return { service, findByIdentity, create, saveItems, getProduct };
};

const guest: CartIdentity = { guestToken: GUEST_TOKEN };

describe('CartsService', () => {
  it('creates a guest cart on first read', async () => {
    const { service, findByIdentity, create } = setup();
    findByIdentity.mockResolvedValue(null);

    const result = await service.getCart(guest);

    expect(create).toHaveBeenCalledWith(guest);
    expect(result).toMatchObject({
      kind: 'guest',
      items: [],
      totalItems: 0,
      subtotal: '0',
      shippingFee: '0',
      total: '0',
    });
  });

  it('adds an item and calculates shipping', async () => {
    const { service, saveItems } = setup();

    const result = await service.addItem(guest, PRODUCT_ID, 2);

    expect(saveItems).toHaveBeenCalledWith(emptyCart.id, [
      { productId: PRODUCT_ID, quantity: 2 },
    ]);
    expect(result).toMatchObject({
      totalItems: 2,
      subtotal: '50000',
      shippingFee: '25000',
      total: '75000',
    });
  });

  it('makes shipping free at the threshold', async () => {
    const { service } = setup(emptyCart, '250000');

    const result = await service.addItem(guest, PRODUCT_ID, 1);

    expect(result).toMatchObject({
      subtotal: '250000',
      shippingFee: '0',
      total: '250000',
    });
  });

  it('uses only the user cart when signed in', async () => {
    const { service, findByIdentity } = setup({
      ...emptyCart,
      userId: USER_ID,
      guestToken: null,
    });
    const identity: CartIdentity = { userId: USER_ID };

    const result = await service.getCart(identity);

    expect(findByIdentity).toHaveBeenCalledWith(identity);
    expect(result.kind).toBe('user');
  });

  it(`rejects more than ${MAX_CART_ITEMS} items`, async () => {
    const { service, saveItems } = setup({
      ...emptyCart,
      items: [{ productId: PRODUCT_ID, quantity: MAX_CART_ITEMS }],
    });

    await expect(service.addItem(guest, PRODUCT_ID, 1)).rejects.toThrow(
      CartLimitExceededException,
    );
    expect(saveItems).not.toHaveBeenCalled();
  });

  it('removes an item when quantity becomes zero', async () => {
    const { service, saveItems } = setup({
      ...emptyCart,
      items: [{ productId: PRODUCT_ID, quantity: 3 }],
    });

    const result = await service.setItemQuantity(guest, PRODUCT_ID, 0);

    expect(saveItems).toHaveBeenCalledWith(emptyCart.id, []);
    expect(result.items).toEqual([]);
  });
});
