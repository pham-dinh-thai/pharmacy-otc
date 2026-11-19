import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class CategoryNameRequiredException extends DomainException {
  public constructor() {
    super('Category name is required', 'CATEGORY_NAME_REQUIRED');
  }
}

export class CategoryNameTooLongException extends DomainException {
  public constructor() {
    super('Category name is too long', 'CATEGORY_NAME_TOO_LONG');
  }
}

export class CategorySlugRequiredException extends DomainException {
  public constructor() {
    super('Category slug is required', 'CATEGORY_SLUG_REQUIRED');
  }
}

export class CategorySlugTooLongException extends DomainException {
  public constructor() {
    super('Category slug is too long', 'CATEGORY_SLUG_TOO_LONG');
  }
}

export class CategoryNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Category id ${id} not found`, 'CATEGORY_NOT_FOUND');
  }
}

export class CategoryAlreadyExistsException extends DomainException {
  public constructor(value: string) {
    super(
      `Category name or slug already exists: ${value}`,
      'CATEGORY_ALREADY_EXISTS',
    );
  }
}

export class CategoryAlreadyDeletedException extends DomainException {
  public constructor(id: string) {
    super(`Category id ${id} is already deleted`, 'CATEGORY_ALREADY_DELETED');
  }
}

export class CategoryNotDeletedException extends DomainException {
  public constructor(id: string) {
    super(`Category id ${id} is not deleted`, 'CATEGORY_NOT_DELETED');
  }
}
