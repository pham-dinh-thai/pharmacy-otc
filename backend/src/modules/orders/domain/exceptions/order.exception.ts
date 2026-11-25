import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class OrderNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Order with id "${id}" is not found`, 'ORDER_NOT_FOUND');
  }
}

export class EmptyOrderException extends DomainException {
  public constructor() {
    super('Order has no items', 'ORDER_NO_ITEMS');
  }
}

export class DuplicateOrderLineException extends DomainException {
  public constructor(productId: string) {
    super(
      `Product "${productId}" appears more than once in the order`,
      'ORDER_DUPLICATE_PRODUCT',
    );
  }
}

export class InvalidOrderStatusException extends DomainException {
  public constructor(action: string, currentStatus: string) {
    super(
      `Order can not be ${action} from status "${currentStatus}"`,
      'ORDER_INVALID_STATUS',
    );
  }
}

export class OrderAlreadyPaidException extends DomainException {
  public constructor() {
    super('Order is already paid', 'ORDER_ALREADY_PAID');
  }
}

export class InvalidOrderProductNameException extends DomainException {
  public constructor(message: string) {
    super(message, 'ORDER_INVALID_PRODUCT_NAME');
  }
}

export class InvalidOrderLineQuantityException extends DomainException {
  public constructor() {
    super(
      'Order line quantity must be greater than 0',
      'ORDER_LINE_QUANTITY_REQUIRED',
    );
  }
}
