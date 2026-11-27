import {
  InvalidStockQuantityException,
  InsufficientStockException,
} from '../../exceptions/inventory.exceptions';
import { Quantity } from '../../../../../shared/domain/value-objects/quantity.value-object';

export class StockQuantity {
  private constructor(private readonly quantity: Quantity) {}

  public static create(value: number): StockQuantity {
    return new StockQuantity(Quantity.create(value));
  }

  public static assertPositive(value: number, label: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new InvalidStockQuantityException(
        `${label} must be a positive integer`,
      );
    }
  }

  public increase(quantity: number): StockQuantity {
    return new StockQuantity(this.quantity.add(quantity));
  }

  public decrease(quantity: number): StockQuantity {
    if (quantity > this.quantity.getValue()) {
      throw new InsufficientStockException(this.quantity.getValue(), quantity);
    }

    return new StockQuantity(this.quantity.subtract(quantity));
  }

  public getValue(): number {
    return this.quantity.getValue();
  }
}
