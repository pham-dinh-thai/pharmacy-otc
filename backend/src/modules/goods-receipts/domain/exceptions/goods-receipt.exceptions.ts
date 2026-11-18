import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class GoodsReceiptNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Goods receipt id ${id} not found`, 'GOODS_RECEIPT_NOT_FOUND');
  }
}

export class InvalidGoodsReceiptCodeException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_GOODS_RECEIPT_CODE');
  }
}

export class GoodsReceiptLineNotFoundException extends DomainException {
  public constructor(lineId: string) {
    super(
      `Goods receipt line ${lineId} not found`,
      'GOODS_RECEIPT_LINE_NOT_FOUND',
    );
  }
}

export class GoodsReceiptNotPendingException extends DomainException {
  public constructor(action: 'confirmed' | 'cancelled') {
    super(
      `Only pending goods receipts can be ${action}`,
      'GOODS_RECEIPT_NOT_PENDING',
    );
  }
}

export class GoodsReceiptHasNoLinesException extends DomainException {
  public constructor() {
    super(
      'Goods receipt must have at least one line',
      'GOODS_RECEIPT_NO_LINES',
    );
  }
}

export class DuplicateGoodsReceiptLineException extends DomainException {
  public constructor(productId: string, lotNumber: string) {
    super(
      `Duplicate line for product ${productId} and lot "${lotNumber}"`,
      'DUPLICATE_GOODS_RECEIPT_LINE',
    );
  }
}

export class GoodsReceiptLineAlreadyAttachedException extends DomainException {
  public constructor(lineId: string, batchId: string) {
    super(
      `Line ${lineId} is already attached to batch ${batchId}`,
      'GOODS_RECEIPT_LINE_ALREADY_ATTACHED',
    );
  }
}

export class InvalidGoodsReceiptLineQuantityException extends DomainException {
  public constructor() {
    super(
      'Goods receipt line quantity must be greater than 0',
      'INVALID_GOODS_RECEIPT_LINE_QUANTITY',
    );
  }
}

export class InvalidExpiresAtException extends DomainException {
  public constructor() {
    super('Expires at must be a valid date', 'INVALID_EXPIRES_AT');
  }
}
