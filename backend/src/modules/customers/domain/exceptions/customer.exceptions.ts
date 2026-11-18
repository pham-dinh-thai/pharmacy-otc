import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class CustomerAlreadyExistsException extends DomainException {
  public constructor() {
    super('Customer already exists', 'CUSTOMER_ALREADY_EXISTS');
  }
}
