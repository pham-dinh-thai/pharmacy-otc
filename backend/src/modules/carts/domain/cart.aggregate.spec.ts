import { describe, expect, it } from '@jest/globals';
import { Cart, MAX_CART_ITEMS } from './cart.aggregate';
import {
  CartItemNotFoundException,
  CartLimitExceededException,
  InvalidCartIdentityException,
  InvalidCartItemQuantityException,
} from './exceptions/cart.exceptions';

const GUEST_TOKEN = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const OTHER_PRODUCT_ID = '742b3190-9e97-4ce3-8533-894bc879b4fc';

const guestCart = () => Cart.create({ guestToken: GUEST_TOKEN });

describe('Cart', () => {
  it('requires exactly one identity', () => {
    expect(() => Cart.create({})).toThrow(InvalidCartIdentityException);
    expect(() =>
      Cart.create({ userId: USER_ID, guestToken: GUEST_TOKEN }),
    ).toThrow(InvalidCartIdentityException);
  });

  it('exposes the identity and kind it was created with', () => {
    expect(guestCart().getIdentity()).toEqual({ guestToken: GUEST_TOKEN });
    expect(guestCart().getKind()).toBe('guest');

    const userCart = Cart.create({ userId: USER_ID });

    expect(userCart.getIdentity()).toEqual({ userId: USER_ID });
    expect(userCart.getKind()).toBe('user');
  });

  it('merges repeated additions of the same product', () => {
    const cart = guestCart();

    cart.addItem(PRODUCT_ID, 2);
    cart.addItem(PRODUCT_ID, 3);

    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0].getQuantity()).toBe(5);
  });

  it('rejects invalid quantities', () => {
    const cart = guestCart();

    expect(() => cart.addItem(PRODUCT_ID, 0)).toThrow(
      InvalidCartItemQuantityException,
    );
    expect(cart.getItems()).toHaveLength(0);
  });

  it('enforces the total item limit', () => {
    const cart = guestCart();
    cart.addItem(PRODUCT_ID, MAX_CART_ITEMS);

    expect(() => cart.addItem(OTHER_PRODUCT_ID, 1)).toThrow(
      CartLimitExceededException,
    );
  });

  it('removes an item when its quantity becomes zero', () => {
    const cart = guestCart();
    cart.addItem(PRODUCT_ID, 2);

    cart.setItemQuantity(PRODUCT_ID, 0);

    expect(cart.getItems()).toEqual([]);
  });

  it('rejects setting the quantity of a missing item', () => {
    expect(() => guestCart().setItemQuantity(PRODUCT_ID, 1)).toThrow(
      CartItemNotFoundException,
    );
  });

  it('removes and clears items', () => {
    const cart = guestCart();
    cart.addItem(PRODUCT_ID, 1);
    cart.addItem(OTHER_PRODUCT_ID, 1);

    cart.removeItem(PRODUCT_ID);
    expect(cart.getItems().map((item) => item.getProductId())).toEqual([
      OTHER_PRODUCT_ID,
    ]);

    cart.clear();
    expect(cart.getItems()).toEqual([]);
  });

  it('does not expose its internal items array', () => {
    const cart = guestCart();
    cart.addItem(PRODUCT_ID, 1);

    cart.getItems().push(cart.getItems()[0]);

    expect(cart.getItems()).toHaveLength(1);
  });
});
