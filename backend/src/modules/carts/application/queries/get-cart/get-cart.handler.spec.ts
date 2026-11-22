import { describe, expect, it, jest } from '@jest/globals';
import type { StorefrontProduct } from '../../../../storefront/application/storefront.read-model';
import { Cart } from '../../../domain/cart.aggregate';
import type { CartIdentity } from '../../../domain/cart-identity';
import type { ICartsRepository } from '../../../domain/carts.repository';
import type { ICartCatalog } from '../../ports/cart-catalog.port';
import { GetCartHandler } from './get-cart.handler';
import { GetCartQuery } from './get-cart.query';

const GUEST_TOKEN = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const identity: CartIdentity = { guestToken: GUEST_TOKEN };

const product = (unitPrice = '25000'): StorefrontProduct => ({
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
});

const setup = (
  cart: Cart | null,
  products: StorefrontProduct[] = [product()],
) => {
  const findByIdentity = jest
    .fn<ICartsRepository['findByIdentity']>()
    .mockResolvedValue(cart);
  const findProducts = jest
    .fn<ICartCatalog['findProducts']>()
    .mockResolvedValue(new Map(products.map((item) => [item.id, item])));
  const handler = new GetCartHandler(
    { findByIdentity } as unknown as ICartsRepository,
    { findProducts } as unknown as ICartCatalog,
  );

  return { handler, findByIdentity, findProducts };
};

describe('GetCartHandler', () => {
  it('returns an empty cart without persisting when none exists', async () => {
    const { handler, findByIdentity } = setup(null);

    const result = await handler.execute(new GetCartQuery(identity));

    expect(findByIdentity).toHaveBeenCalledWith(identity);
    expect(result).toMatchObject({
      kind: 'guest',
      items: [],
      totalItems: 0,
      subtotal: '0',
      shippingFee: '0',
      total: '0',
    });
  });

  it('renders items with line totals and shipping', async () => {
    const cart = Cart.create(identity);
    cart.addItem(PRODUCT_ID, 2);
    const { handler } = setup(cart);

    const result = await handler.execute(new GetCartQuery(identity));

    expect(result.items).toHaveLength(1);
    expect(result.items[0].lineTotal).toBe('50000');
    expect(result).toMatchObject({
      totalItems: 2,
      subtotal: '50000',
      shippingFee: '25000',
      total: '75000',
    });
  });

  it('makes shipping free at the threshold and hides missing products', async () => {
    const cart = Cart.create(identity);
    cart.addItem(PRODUCT_ID, 1);
    const { handler } = setup(cart, [product('250000')]);

    const result = await handler.execute(new GetCartQuery(identity));

    expect(result).toMatchObject({
      subtotal: '250000',
      shippingFee: '0',
      total: '250000',
    });

    const empty = setup(cart, []);
    const withoutCatalogProduct = await empty.handler.execute(
      new GetCartQuery(identity),
    );

    expect(withoutCatalogProduct.items).toEqual([]);
  });

  it('uses the user kind for a signed-in identity', async () => {
    const userIdentity: CartIdentity = { userId: identity.guestToken };
    const { handler } = setup(Cart.create(userIdentity));

    const result = await handler.execute(new GetCartQuery(userIdentity));

    expect(result.kind).toBe('user');
  });
});
