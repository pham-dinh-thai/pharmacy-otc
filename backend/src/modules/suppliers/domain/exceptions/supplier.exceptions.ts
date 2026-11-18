import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class SupplierNotFoundException extends DomainException {
  public constructor(id?: string) {
    super(
      id === undefined ? 'Supplier not found' : `Supplier id ${id} not found`,
      'SUPPLIER_NOT_FOUND',
    );
  }
}

export class SupplierAlreadyDeletedException extends DomainException {
  public constructor() {
    super('Supplier is already deleted', 'SUPPLIER_ALREADY_DELETED');
  }
}

export class SupplierNotDeletedException extends DomainException {
  public constructor() {
    super('Supplier is not deleted', 'SUPPLIER_NOT_DELETED');
  }
}

export class InvalidSupplierCodeException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_SUPPLIER_CODE');
  }
}

export class SupplierPhoneRequiredException extends DomainException {
  public constructor() {
    super('Phone number is required', 'SUPPLIER_PHONE_REQUIRED');
  }
}

export class InvalidSupplierPhoneException extends DomainException {
  public constructor() {
    super('Invalid Vietnam phone number', 'INVALID_SUPPLIER_PHONE');
  }
}
