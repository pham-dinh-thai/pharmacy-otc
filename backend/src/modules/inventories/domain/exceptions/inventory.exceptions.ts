import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class InventoryNotFoundException extends DomainException {
  public constructor(productId: string) {
    super(
      `Inventory with productId ${productId} not found`,
      'INVENTORY_NOT_FOUND',
    );
  }
}

export class BatchNotFoundException extends DomainException {
  public constructor(batchId: string) {
    super(`Batch id ${batchId} not found`, 'BATCH_NOT_FOUND');
  }
}

export class InvalidStockQuantityException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_STOCK_QUANTITY');
  }
}

export class InsufficientStockException extends DomainException {
  public constructor(available: number, requested: number) {
    super(
      `Not enough stock: available ${available}, requested ${requested}`,
      'INSUFFICIENT_STOCK',
    );
  }
}
