import { Quantity } from '../../../shared/value-objects/quantity.value-object';
import { Id } from '../../../shared/value-objects/id.value-object';
import { CartItem } from './cart-item.entity';
import type { CartIdentity } from './cart-identity';
import {
  CartItemNotFoundException,
  CartLimitExceededException,
  InvalidCartIdentityException,
} from './exceptions/cart.exceptions';

export const MAX_CART_ITEMS = 100;

export type FromPersistentCartProps = {
  id: string;
  userId: string | null;
  guestToken: string | null;
  items: {
    id: string;
    productId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export class Cart {
  private constructor(
    private readonly id: Id,
    private readonly userId: string | null,
    private readonly guestToken: string | null,
    private items: CartItem[],
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(identity: CartIdentity): Cart {
    if (Boolean(identity.userId) === Boolean(identity.guestToken)) {
      throw new InvalidCartIdentityException();
    }

    const now = new Date();

    return new Cart(
      Id.generate(),
      identity.userId ?? null,
      identity.guestToken ?? null,
      [],
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentCartProps): Cart {
    return new Cart(
      Id.create(props.id),
      props.userId,
      props.guestToken,
      props.items.map((item) => CartItem.fromPersistent(item)),
      props.createdAt,
      props.updatedAt,
    );
  }

  public addItem(productId: string, quantity: number): void {
    const value = Quantity.create(quantity);
    const existing = this.items.find((item) => item.isForProduct(productId));

    if (existing) {
      existing.increase(value.getValue());
    } else {
      this.items.push(CartItem.create({ productId, quantity }));
    }

    this.assertLimit();
    this.updatedAt = new Date();
  }

  public setItemQuantity(productId: string, quantity: number): void {
    const value = Quantity.create(quantity);
    const index = this.items.findIndex((item) => item.isForProduct(productId));

    if (value.isZero()) {
      if (index >= 0) {
        this.items.splice(index, 1);
        this.updatedAt = new Date();
      }

      return;
    }

    if (index < 0) {
      throw new CartItemNotFoundException(productId);
    }

    this.items[index].setQuantity(value.getValue());
    this.assertLimit();
    this.updatedAt = new Date();
  }

  public removeItem(productId: string): void {
    const remaining = this.items.filter(
      (item) => !item.isForProduct(productId),
    );

    if (remaining.length === this.items.length) return;

    this.items = remaining;
    this.updatedAt = new Date();
  }

  public clear(): void {
    if (this.items.length === 0) return;

    this.items = [];
    this.updatedAt = new Date();
  }

  public getIdentity(): CartIdentity {
    return this.userId
      ? { userId: this.userId }
      : { guestToken: this.guestToken ?? undefined };
  }

  public getItems(): CartItem[] {
    return [...this.items];
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public getGuestToken(): string | null {
    return this.guestToken;
  }

  public getKind(): 'guest' | 'user' {
    return this.userId ? 'user' : 'guest';
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  public getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  private assertLimit(): void {
    const total = this.items.reduce((sum, item) => sum + item.getQuantity(), 0);

    if (total > MAX_CART_ITEMS) {
      throw new CartLimitExceededException(MAX_CART_ITEMS);
    }
  }
}
