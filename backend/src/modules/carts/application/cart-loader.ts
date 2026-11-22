import { Cart } from '../domain/cart.aggregate';
import type { CartIdentity } from '../domain/cart-identity';
import type {
  FindCartOptions,
  ICartsRepository,
} from '../domain/carts.repository';

/** Loads the stored cart for an identity, or starts a new one to be persisted. */
export const loadOrCreateCart = async (
  repository: ICartsRepository,
  identity: CartIdentity,
  options?: FindCartOptions,
): Promise<{ cart: Cart; isNew: boolean }> => {
  const cart = await repository.findByIdentity(identity, options);

  return cart
    ? { cart, isNew: false }
    : { cart: Cart.create(identity), isNew: true };
};
