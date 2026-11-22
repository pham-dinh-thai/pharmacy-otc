import { Injectable } from '@nestjs/common';
import { EntityManager, LockMode } from '@mikro-orm/core';
import { Cart } from '../../domain/cart.aggregate';
import type { CartIdentity } from '../../domain/cart-identity';
import type {
  FindCartOptions,
  ICartsRepository,
} from '../../domain/carts.repository';
import { MikroCart } from '../entities/mikro-cart.entity';
import { MikroCartItem } from '../entities/mikro-cart-item.entity';
import { CartMapper } from '../mappers/cart.mapper';

@Injectable()
export class MikroCartsRepository implements ICartsRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findByIdentity(
    identity: CartIdentity,
    options: FindCartOptions = {},
  ): Promise<Cart | null> {
    const lockMode = options.forUpdate ? LockMode.PESSIMISTIC_WRITE : undefined;
    const mikroCart = await this.entityManager.findOne(
      MikroCart,
      identity.userId
        ? { userId: identity.userId }
        : { guestToken: identity.guestToken ?? '' },
      { lockMode },
    );

    if (!mikroCart) return null;

    const mikroItems = await this.entityManager.find(
      MikroCartItem,
      { cartId: mikroCart.id },
      { orderBy: { createdAt: 'asc', id: 'asc' }, lockMode },
    );

    return CartMapper.toDomain(mikroCart, mikroItems);
  }

  public async create(cart: Cart): Promise<Cart> {
    const { cart: mikroCart, items } = CartMapper.toMikro(cart);

    this.entityManager.persist(mikroCart);
    await this.entityManager.flush();
    await this.replaceItems(cart.getId(), items);

    return CartMapper.toDomain(mikroCart, items);
  }

  public async update(cart: Cart): Promise<Cart> {
    const mikroCart = this.entityManager.getReference(MikroCart, cart.getId());
    const { items } = CartMapper.toMikro(cart);

    CartMapper.assign(mikroCart, cart);
    await this.replaceItems(cart.getId(), items);
    await this.entityManager.flush();

    return cart;
  }

  private async replaceItems(
    cartId: string,
    items: MikroCartItem[],
  ): Promise<void> {
    await this.entityManager.nativeDelete(MikroCartItem, { cartId });

    if (items.length > 0) {
      await this.entityManager.insertMany(MikroCartItem, items);
    }
  }
}
