import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class AccountNotFoundException extends DomainException {
  public constructor(userId: string) {
    super(`Account for user id ${userId} not found`, 'ACCOUNT_NOT_FOUND');
  }
}

export class InvalidPasswordException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_PASSWORD');
  }
}

export class CurrentPasswordMismatchException extends DomainException {
  public constructor() {
    super('Current password is mismatch', 'CURRENT_PASSWORD_MISMATCH');
  }
}

export class NewPasswordConfirmationMismatchException extends DomainException {
  public constructor() {
    super(
      'New password is mismatch with new password confirmation',
      'NEW_PASSWORD_CONFIRMATION_MISMATCH',
    );
  }
}

export class InvalidCredentialsException extends DomainException {
  public constructor() {
    super('Email or password invalid', 'INVALID_CREDENTIALS');
  }
}

export class AccountDeactivatedException extends DomainException {
  public constructor() {
    super('Account deactivated', 'ACCOUNT_DEACTIVATED');
  }
}

export class EmployeeResignedException extends DomainException {
  public constructor() {
    super('Employee resigned', 'EMPLOYEE_RESIGNED');
  }
}

export class InvalidRefreshTokenException extends DomainException {
  public constructor() {
    super('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }
}

export class AuthUserNotFoundException extends DomainException {
  public constructor() {
    super('User Not Found', 'AUTH_USER_NOT_FOUND');
  }
}

export class AuthAccountNotFoundException extends DomainException {
  public constructor() {
    super('Account Not Found', 'AUTH_ACCOUNT_NOT_FOUND');
  }
}

export class AuthEmployeeResignedException extends DomainException {
  public constructor() {
    super('Employee resigned', 'AUTH_EMPLOYEE_RESIGNED');
  }
}
