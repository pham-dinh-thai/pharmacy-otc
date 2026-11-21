import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import {
  CartIdentity,
  CartItemRecord,
  CartRecord,
  ICartsRepository,
} from '../../domain/carts.repository';
import { MikroCart } from '../entities/mikro-cart.entity';
import { MikroCartItem } from '../entities/mikro-cart-item.entity';

@Injectable()
export class MikroCartsRepository implements ICartsRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findByIdentity(
    identity: CartIdentity,
  ): Promise<CartRecord | null> {
    const cart = await this.entityManager.findOne(
      MikroCart,
      identity.userId
        ? { userId: identity.userId }
        : { guestToken: identity.guestToken ?? '' },
    );

    if (!cart) return null;

    return this.toRecord(cart);
  }

  public async create(identity: CartIdentity): Promise<CartRecord> {
    const now = new Date();
    const cart = this.entityManager.create(MikroCart, {
      id: randomUUID(),
      userId: identity.userId ?? null,
      guestToken: identity.userId ? null : (identity.guestToken ?? null),
      createdAt: now,
      updatedAt: now,
    });

    this.entityManager.persist(cart);
    await this.entityManager.flush();

    return this.toRecord(cart);
  }

  public async saveItems(
    cartId: string,
    items: CartItemRecord[],
  ): Promise<void> {
    await this.entityManager.transactional(async (em) => {
      await em.nativeDelete(MikroCartItem, { cartId });

      const now = new Date();
      for (const item of items) {
        em.create(MikroCartItem, {
          id: randomUUID(),
          cartId,
          productId: item.productId,
          quantity: item.quantity,
          createdAt: now,
          updatedAt: now,
        });
      }
    });
  }

  public async delete(cartId: string): Promise<void> {
    await this.entityManager.nativeDelete(MikroCart, { id: cartId });
  }

  private async toRecord(cart: MikroCart): Promise<CartRecord> {
    return {
      id: cart.id,
      userId: cart.userId,
      guestToken: cart.guestToken,
      items: await this.findItems(this.entityManager, cart.id),
    };
  }

  private async findItems(
    em: EntityManager,
    cartId: string,
  ): Promise<CartItemRecord[]> {
    const rows = await em.find(
      MikroCartItem,
      { cartId },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );

    return rows.map((row) => ({
      productId: row.productId,
      quantity: row.quantity,
    }));
  }
}
