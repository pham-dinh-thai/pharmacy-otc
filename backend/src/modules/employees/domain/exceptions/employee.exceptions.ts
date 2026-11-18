import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class EmployeeNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Employee id ${id} not found`, 'EMPLOYEE_NOT_FOUND');
  }
}

export class UserIdRequiredException extends DomainException {
  public constructor() {
    super('User id is required', 'USER_ID_REQUIRED');
  }
}

export class DepartmentIdRequiredException extends DomainException {
  public constructor() {
    super('Department id is required', 'DEPARTMENT_ID_REQUIRED');
  }
}

export class InvalidEmployeePositionException extends DomainException {
  public constructor() {
    super('Invalid employee position', 'INVALID_EMPLOYEE_POSITION');
  }
}
