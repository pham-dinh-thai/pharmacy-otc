import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class DepartmentNotFoundException extends DomainException {
  public constructor(id: string, message?: string) {
    super(message ?? `Department id ${id} not found`, 'DEPARTMENT_NOT_FOUND');
  }
}

export class DepartmentDisabledException extends DomainException {
  public constructor() {
    super('Department is disabled', 'DEPARTMENT_DISABLED');
  }
}

export class DepartmentAlreadyDisabledException extends DomainException {
  public constructor() {
    super('Department is already disabled', 'DEPARTMENT_ALREADY_DISABLED');
  }
}

export class DepartmentNotDisabledException extends DomainException {
  public constructor() {
    super('Department is not disabled', 'DEPARTMENT_NOT_DISABLED');
  }
}

export class DepartmentNameRequiredException extends DomainException {
  public constructor() {
    super('Department name is required', 'DEPARTMENT_NAME_REQUIRED');
  }
}

export class DepartmentNameTooLongException extends DomainException {
  public constructor(maxLength: number) {
    super(
      `Department name must have at most ${maxLength} characters`,
      'DEPARTMENT_NAME_TOO_LONG',
    );
  }
}
