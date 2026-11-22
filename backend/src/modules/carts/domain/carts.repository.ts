import { Cart } from './cart.aggregate';
import type { CartIdentity } from './cart-identity';

export type FindCartOptions = {
  forUpdate?: boolean;
};

export interface ICartsRepository {
  findByIdentity(
    identity: CartIdentity,
    options?: FindCartOptions,
  ): Promise<Cart | null>;

  create(cart: Cart): Promise<Cart>;

  update(cart: Cart): Promise<Cart>;
}

export const CARTS_REPOSITORY = 'ICartsRepository';
