import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class CartLimitExceededException extends DomainException {
  public constructor(limit: number) {
    super(`Cart can not hold more than ${limit} items`, 'CART_LIMIT_EXCEEDED');
  }
}

export class InvalidCartIdentityException extends DomainException {
  public constructor() {
    super(
      'Cart must belong either to a user or to a guest',
      'INVALID_CART_IDENTITY',
    );
  }
}

export class CartItemNotFoundException extends DomainException {
  public constructor(productId: string) {
    super(`Cart item ${productId} not found`, 'CART_ITEM_NOT_FOUND');
  }
}

export class InvalidCartItemQuantityException extends DomainException {
  public constructor() {
    super(
      'Cart item quantity must be greater than 0',
      'INVALID_CART_ITEM_QUANTITY',
    );
  }
}
