import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class ExpenseInvalidStatusException extends DomainException {
  public constructor(message: string) {
    super(message, 'EXPENSE_INVALID_STATUS');
  }
}

export class ExpenseAlreadyCancelledException extends DomainException {
  public constructor() {
    super('Expense is already cancelled', 'EXPENSE_ALREADY_CANCELLED');
  }
}

export class ExpenseNameRequiredException extends DomainException {
  public constructor() {
    super('Expense name is required', 'EXPENSE_NAME_REQUIRED');
  }
}

export class InvalidExpenseDateException extends DomainException {
  public constructor() {
    super('Invalid expense date', 'INVALID_EXPENSE_DATE');
  }
}
