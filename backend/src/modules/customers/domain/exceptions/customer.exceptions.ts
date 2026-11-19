import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class CustomerAlreadyExistsException extends DomainException {
  public constructor() {
    super('Customer already exists', 'CUSTOMER_ALREADY_EXISTS');
  }
}

export class CustomerNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Customer id ${id} not found`, 'CUSTOMER_NOT_FOUND');
  }
}

export class CustomerAlreadyDeletedException extends DomainException {
  public constructor(id: string) {
    super(`Customer id ${id} is already deleted`, 'CUSTOMER_ALREADY_DELETED');
  }
}

export class CustomerNotDeletedException extends DomainException {
  public constructor(id: string) {
    super(`Customer id ${id} is not deleted`, 'CUSTOMER_NOT_DELETED');
  }
}

export class CustomerPhoneRequiredException extends DomainException {
  public constructor() {
    super('At least one customer phone is required', 'CUSTOMER_PHONE_REQUIRED');
  }
}

export class CustomerAddressRequiredException extends DomainException {
  public constructor() {
    super(
      'At least one customer address is required',
      'CUSTOMER_ADDRESS_REQUIRED',
    );
  }
}
