import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class CartLimitExceededException extends DomainException {
  public constructor(limit: number) {
    super(`Cart can not hold more than ${limit} items`, 'CART_LIMIT_EXCEEDED');
  }
}
