import { ProductIdRequiredException } from '../../../shared/domain/exceptions/value-object.exceptions';
import { Id } from '../../../shared/domain/value-objects/id.value-object';
import { Money } from '../../../shared/domain/value-objects/money.value-object';
import { Quantity } from '../../../shared/domain/value-objects/quantity.value-object';
import {
  InvalidOrderLineQuantityException,
  InvalidOrderProductNameException,
} from './exceptions/order.exception';

const MAX_PRODUCT_NAME_LENGTH = 255;
const MAX_PRODUCT_SKU_LENGTH = 100;

export type CreateOrderLineProps = {
  productId: string;
  productName: string;
  productSku: string | null;
  unitPrice: bigint;
  quantity: number;
};

export type FromPersistentOrderLineProps = CreateOrderLineProps & {
  id: string;
};

export class OrderLine {
  private constructor(
    private readonly id: Id,
    private readonly productId: string,
    private readonly productName: string,
    private readonly productSku: string | null,
    private readonly unitPrice: Money,
    private readonly quantity: Quantity,
  ) {}

  public static create(props: CreateOrderLineProps): OrderLine {
    return new OrderLine(
      Id.generateV7(),
      OrderLine.normalizeProductId(props.productId),
      OrderLine.normalizeProductName(props.productName),
      OrderLine.normalizeProductSku(props.productSku),
      Money.create(props.unitPrice),
      OrderLine.normalizeQuantity(props.quantity),
    );
  }

  public static fromPersistent(props: FromPersistentOrderLineProps): OrderLine {
    return new OrderLine(
      Id.create(props.id),
      OrderLine.normalizeProductId(props.productId),
      OrderLine.normalizeProductName(props.productName),
      OrderLine.normalizeProductSku(props.productSku),
      Money.create(props.unitPrice),
      OrderLine.normalizeQuantity(props.quantity),
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
      throw new InvalidOrderProductNameException('Product name is required');
    }

    if (productName.length > MAX_PRODUCT_NAME_LENGTH) {
      throw new InvalidOrderProductNameException(
        `Product name must have at most ${MAX_PRODUCT_NAME_LENGTH} characters`,
      );
    }

    return productName;
  }

  private static normalizeProductSku(raw: string | null): string | null {
    const productSku = raw?.trim().toUpperCase();

    return productSku ? productSku.slice(0, MAX_PRODUCT_SKU_LENGTH) : null;
  }

  private static normalizeQuantity(value: number): Quantity {
    const quantity = Quantity.create(value);

    if (quantity.isZero()) {
      throw new InvalidOrderLineQuantityException();
    }

    return quantity;
  }
}
