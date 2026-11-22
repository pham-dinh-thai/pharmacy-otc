import { Cart } from '../../domain/cart.aggregate';
import { CartItem } from '../../domain/cart-item.entity';
import { MikroCart } from '../entities/mikro-cart.entity';
import { MikroCartItem } from '../entities/mikro-cart-item.entity';

export class CartMapper {
  public static toDomain(
    mikroCart: MikroCart,
    mikroItems: MikroCartItem[],
  ): Cart {
    return Cart.fromPersistent({
      id: mikroCart.id,
      userId: mikroCart.userId,
      guestToken: mikroCart.guestToken,
      items: mikroItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      createdAt: mikroCart.createdAt,
      updatedAt: mikroCart.updatedAt,
    });
  }

  public static toMikro(cart: Cart): {
    cart: MikroCart;
    items: MikroCartItem[];
  } {
    return {
      cart: CartMapper.assign(new MikroCart(), cart),
      items: cart
        .getItems()
        .map((item) => CartMapper.toItemMikro(item, cart.getId())),
    };
  }

  public static assign(mikroCart: MikroCart, cart: Cart): MikroCart {
    mikroCart.id = cart.getId();
    mikroCart.userId = cart.getUserId();
    mikroCart.guestToken = cart.getGuestToken();
    mikroCart.createdAt = cart.getCreatedAt();
    mikroCart.updatedAt = cart.getUpdatedAt();

    return mikroCart;
  }

  private static toItemMikro(item: CartItem, cartId: string): MikroCartItem {
    const mikroItem = new MikroCartItem();

    mikroItem.id = item.getId();
    mikroItem.cartId = cartId;
    mikroItem.productId = item.getProductId();
    mikroItem.quantity = item.getQuantity();
    mikroItem.createdAt = item.getCreatedAt();
    mikroItem.updatedAt = item.getUpdatedAt();

    return mikroItem;
  }
}
