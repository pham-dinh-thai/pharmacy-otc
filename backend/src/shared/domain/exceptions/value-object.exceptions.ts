import { DomainException } from './domain.exception';

export class InvalidIdException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_ID');
  }
}

export class InvalidQuantityException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_QUANTITY');
  }
}

export class InvalidAmountException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_AMOUNT');
  }
}

export class InvalidLotNumberException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_LOT_NUMBER');
  }
}

export class ProductIdRequiredException extends DomainException {
  public constructor() {
    super('Product id is required', 'PRODUCT_ID_REQUIRED');
  }
}
