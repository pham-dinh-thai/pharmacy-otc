import { type DomainExceptionCode } from './domain-exception-codes';

/**
 * Base class for every business-rule violation raised by the domain and the
 * application layer. Transport concerns (HTTP status) are derived from `code`.
 */
export class DomainException extends Error {
  public constructor(
    message: string,
    public readonly code: DomainExceptionCode,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
