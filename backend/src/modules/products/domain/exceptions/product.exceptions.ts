import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class ProductNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Product id ${id} not found`, 'PRODUCT_NOT_FOUND');
  }
}

export class ProductAlreadyDeletedException extends DomainException {
  public constructor(id: string) {
    super(`Product id ${id} is already deleted`, 'PRODUCT_ALREADY_DELETED');
  }
}

export class ProductNotDeletedException extends DomainException {
  public constructor(id: string) {
    super(`Product id ${id} is not deleted`, 'PRODUCT_NOT_DELETED');
  }
}

export class ProductCategoryNotFoundException extends DomainException {
  public constructor() {
    super('One or more categories do not exist', 'PRODUCT_CATEGORY_NOT_FOUND');
  }
}

export class ProductSkuAlreadyExistsException extends DomainException {
  public constructor(sku: string) {
    super(`Product SKU already exists: ${sku}`, 'PRODUCT_SKU_ALREADY_EXISTS');
  }
}

export class InvalidProductExpiryDateException extends DomainException {
  public constructor() {
    super(
      'Expiry date must be a valid YYYY-MM-DD date',
      'INVALID_PRODUCT_EXPIRY_DATE',
    );
  }
}
