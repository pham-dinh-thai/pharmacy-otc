import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class AuditLogNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Audit log id ${id} not found`, 'AUDIT_LOG_NOT_FOUND');
  }
}

export class InvalidAuditLogDateRangeException extends DomainException {
  public constructor() {
    super('from must be before or equal to to', 'INVALID_AUDIT_LOG_DATE_RANGE');
  }
}

export class InvalidAuditLogException extends DomainException {
  public constructor(message: string) {
    super(message, 'INVALID_AUDIT_LOG');
  }
}
