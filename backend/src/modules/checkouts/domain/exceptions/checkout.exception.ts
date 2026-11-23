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
