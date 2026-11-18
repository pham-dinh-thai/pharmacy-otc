import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class UserNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`User with id ${id} not found`, 'USER_NOT_FOUND');
  }
}

export class UserByIdNotFoundException extends DomainException {
  public constructor(id: string, message?: string) {
    super(message ?? `User id ${id} not found`, 'USER_NOT_FOUND');
  }
}

export class UserEmailAlreadyExistsException extends DomainException {
  public constructor(email: string) {
    super(`User email ${email} already exists`, 'USER_EMAIL_ALREADY_EXISTS');
  }
}

export class RoleIdRequiredException extends DomainException {
  public constructor() {
    super('Role id is required', 'ROLE_ID_REQUIRED');
  }
}
