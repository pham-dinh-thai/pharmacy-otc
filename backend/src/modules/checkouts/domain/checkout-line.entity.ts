import { Id } from '../../../shared/value-objects/id.value-object';
import { Money } from '../../../shared/value-objects/money.value-object';
import { Quantity } from '../../../shared/value-objects/quantity.value-object';

export type CreateCheckoutLineProps = {
  productId: string;
  unitPrice: bigint;
  quantity: number;
};

export type FromPersistentCheckoutLineProps = {
  id: string;
  productId: string;
  unitPrice: bigint;
  quantity: number;
};

export class CheckoutLine {
  private constructor(
    private readonly id: Id,
    private readonly productId: string,
    private readonly unitPrice: Money,
    private readonly quantity: Quantity,
  ) {}

  public static create(props: CreateCheckoutLineProps): CheckoutLine {
    return new CheckoutLine(
      Id.generateV7(),
      props.productId,
      Money.create(props.unitPrice),
      Quantity.create(props.quantity),
    );
  }

  public static fromPersistent(
    props: FromPersistentCheckoutLineProps,
  ): CheckoutLine {
    return new CheckoutLine(
      Id.create(props.id),
      props.productId,
      Money.create(props.unitPrice),
      Quantity.create(props.quantity),
    );
  }

  public getTotal(): Money {
    return this.unitPrice.multiply(this.quantity.getValue());
  }

  public getId(): string {
    return this.id.toString();
  }

  public getProductId(): string {
    return this.productId;
  }

  public getUnitPrice(): bigint {
    return this.unitPrice.toBigInt();
  }

  public getQuantity(): number {
    return this.quantity.getValue();
  }
}
