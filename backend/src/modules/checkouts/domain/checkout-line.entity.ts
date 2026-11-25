import { ProductIdRequiredException } from '../../../shared/domain/exceptions/value-object.exceptions';
import { Id } from '../../../shared/value-objects/id.value-object';
import { Money } from '../../../shared/value-objects/money.value-object';
import { Quantity } from '../../../shared/value-objects/quantity.value-object';
import { InvalidCheckoutProductNameException } from './exceptions/checkout.exception';

export type CreateCheckoutLineProps = {
  productId: string;
  productName: string;
  productSku: string | null;
  unitPrice: bigint;
  quantity: number;
};

export type FromPersistentCheckoutLineProps = CreateCheckoutLineProps & {
  id: string;
};

export class CheckoutLine {
  private constructor(
    private readonly id: Id,
    private readonly productId: string,
    private readonly productName: string,
    private readonly productSku: string | null,
    private readonly unitPrice: Money,
    private readonly quantity: Quantity,
  ) {}

  public static create(props: CreateCheckoutLineProps): CheckoutLine {
    return new CheckoutLine(
      Id.generateV7(),
      CheckoutLine.normalizeProductId(props.productId),
      CheckoutLine.normalizeProductName(props.productName),
      CheckoutLine.normalizeProductSku(props.productSku),
      Money.create(props.unitPrice),
      Quantity.create(props.quantity),
    );
  }

  public static fromPersistent(
    props: FromPersistentCheckoutLineProps,
  ): CheckoutLine {
    return new CheckoutLine(
      Id.create(props.id),
      CheckoutLine.normalizeProductId(props.productId),
      CheckoutLine.normalizeProductName(props.productName),
      CheckoutLine.normalizeProductSku(props.productSku),
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

  public getProductName(): string {
    return this.productName;
  }

  public getProductSku(): string | null {
    return this.productSku;
  }

  public getUnitPrice(): bigint {
    return this.unitPrice.toBigInt();
  }

  public getQuantity(): number {
    return this.quantity.getValue();
  }

  private static normalizeProductId(raw: string): string {
    const productId = raw?.trim();

    if (!productId) {
      throw new ProductIdRequiredException();
    }

    return productId;
  }

  private static normalizeProductName(raw: string): string {
    const productName = raw?.trim();

    if (!productName) {
      throw new InvalidCheckoutProductNameException();
    }

    return productName;
  }

  private static normalizeProductSku(raw: string | null): string | null {
    const productSku = raw?.trim().toUpperCase();

    return productSku ? productSku.slice(0, 100) : null;
  }
}
