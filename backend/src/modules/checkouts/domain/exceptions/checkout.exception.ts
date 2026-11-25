import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class CanNotUpdateCheckoutStatusException extends DomainException {
  public constructor() {
    super('Checkout is not pending', 'CAN_NOT_UPDATE_CHECKOUT_STATUS');
  }
}

export class CheckoutExpiredException extends DomainException {
  public constructor() {
    super('Checkout is expired', 'CHECKOUT_EXPIRED');
  }
}

export class EmptyCheckoutException extends DomainException {
  public constructor() {
    super('Checkout has no items', 'CHECKOUT_NO_ITEMS');
  }
}

export class CheckoutProductNotInCartException extends DomainException {
  public constructor(productId: string) {
    super(
      `Product "${productId}" is not in the cart`,
      'CHECKOUT_PRODUCT_NOT_IN_CART',
    );
  }
}

export class CheckoutProductNotFoundException extends DomainException {
  public constructor(productId: string) {
    super(
      `Product "${productId}" is not available`,
      'CHECKOUT_PRODUCT_NOT_FOUND',
    );
  }
}

export class CheckoutNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Checkout with id "${id}" is not found`, 'CHECKOUT_NOT_FOUND');
  }
}

export class InvalidCheckoutProductNameException extends DomainException {
  public constructor() {
    super(
      'Checkout line product name is required',
      'CHECKOUT_INVALID_PRODUCT_NAME',
    );
  }
}
