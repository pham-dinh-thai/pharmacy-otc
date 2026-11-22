import { Cart } from '../../domain/cart.aggregate';
import { CartItem } from '../../domain/cart-item.entity';
import { Money } from '../../../../shared/value-objects/money.value-object';
import type { StorefrontProduct } from '../../../storefront/application/storefront.read-model';
import { CartItemReadModel, CartReadModel } from '../cart.read-model';

const FREE_SHIPPING_THRESHOLD = Money.create('250000');
const SHIPPING_FEE = Money.create('25000');

const itemToReadModel = (
  item: CartItem,
  product: StorefrontProduct,
): CartItemReadModel =>
  new CartItemReadModel(
    product,
    item.getQuantity(),
    Money.create(product.unitPrice).multiply(item.getQuantity()).toString(),
  );

/** Products removed from the catalog are hidden without changing the saved cart. */
export const cartToReadModel = (
  cart: Cart,
  products: Map<string, StorefrontProduct>,
): CartReadModel => {
  const items: CartItemReadModel[] = [];
  let subtotal = Money.create(0);
  let totalItems = 0;

  for (const item of cart.getItems()) {
    const product = products.get(item.getProductId());
    if (!product) continue;

    items.push(itemToReadModel(item, product));
    subtotal = subtotal.add(
      Money.create(product.unitPrice).multiply(item.getQuantity()),
    );
    totalItems += item.getQuantity();
  }

  const shippingFee =
    subtotal.getValue() === 0n ||
    subtotal.getValue() >= FREE_SHIPPING_THRESHOLD.getValue()
      ? Money.create(0)
      : SHIPPING_FEE;

  return new CartReadModel(
    cart.getKind(),
    items,
    totalItems,
    subtotal.toString(),
    shippingFee.toString(),
    subtotal.add(shippingFee).toString(),
  );
};
