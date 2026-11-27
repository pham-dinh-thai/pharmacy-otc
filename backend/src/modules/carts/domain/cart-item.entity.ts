import { ProductIdRequiredException } from '../../../shared/domain/exceptions/value-object.exceptions';
import { Id } from '../../../shared/domain/value-objects/id.value-object';
import { Quantity } from '../../../shared/domain/value-objects/quantity.value-object';
import { InvalidCartItemQuantityException } from './exceptions/cart.exceptions';

export type CreateCartItemProps = {
  productId: string;
  quantity: number;
};

export type FromPersistentCartItemProps = {
  id: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export class CartItem {
  private constructor(
    private readonly id: Id,
    private readonly productId: string,
    private quantity: Quantity,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateCartItemProps): CartItem {
    const now = new Date();

    return new CartItem(
      Id.generate(),
      CartItem.productId(props.productId),
      CartItem.quantity(props.quantity),
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentCartItemProps): CartItem {
    return new CartItem(
      Id.create(props.id),
      CartItem.productId(props.productId),
      Quantity.create(props.quantity),
      props.createdAt,
      props.updatedAt,
    );
  }

  public isForProduct(productId: string): boolean {
    return this.productId === productId;
  }

  public increase(quantity: number): void {
    this.quantity = this.quantity.add(quantity);
    this.updatedAt = new Date();
  }

  public setQuantity(quantity: number): void {
    this.quantity = CartItem.quantity(quantity);
    this.updatedAt = new Date();
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getProductId(): string {
    return this.productId;
  }

  public getQuantity(): number {
    return this.quantity.getValue();
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  public getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  private static productId(raw: string): string {
    const productId = raw?.trim();

    if (!productId) {
      throw new ProductIdRequiredException();
    }

    return productId;
  }

  private static quantity(value: number): Quantity {
    const quantity = Quantity.create(value);

    if (quantity.isZero()) {
      throw new InvalidCartItemQuantityException();
    }

    return quantity;
  }
}
