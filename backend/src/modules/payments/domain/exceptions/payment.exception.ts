import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class PaymentMethodUnsupportedException extends DomainException {
  public constructor(method: string) {
    super(
      `Payment method "${method}" is not supported`,
      'PAYMENT_METHOD_UNSUPPORTED',
    );
  }
}

export class PaymentNotFoundException extends DomainException {
  public constructor(reference: string) {
    super(`Payment "${reference}" was not found`, 'PAYMENT_NOT_FOUND');
  }
}

export class PaymentInvalidStatusException extends DomainException {
  public constructor(status: string) {
    super(
      `Payment can not be updated from status "${status}"`,
      'PAYMENT_INVALID_STATUS',
    );
  }
}

export class PaymentAmountMismatchException extends DomainException {
  public constructor() {
    super(
      'Payment amount does not match the order amount',
      'PAYMENT_AMOUNT_MISMATCH',
    );
  }
}

export class PaymentInvalidNotificationException extends DomainException {
  public constructor(message = 'Payment notification payload is invalid') {
    super(message, 'PAYMENT_INVALID_NOTIFICATION');
  }
}
