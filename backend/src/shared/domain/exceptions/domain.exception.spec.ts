import { describe, expect, it, jest } from '@jest/globals';
import { type ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { DomainException } from './domain.exception';

class SampleDomainException extends DomainException {
  public constructor() {
    super('Sample business failure', 'USER_NOT_FOUND');
  }
}

describe('DomainException', () => {
  it('carries the message and the business code', () => {
    const exception = new SampleDomainException();

    expect(exception.message).toBe('Sample business failure');
    expect(exception.code).toBe('USER_NOT_FOUND');
  });

  it('keeps instanceof for subclasses', () => {
    const exception = new SampleDomainException();

    expect(exception).toBeInstanceOf(SampleDomainException);
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception).toBeInstanceOf(Error);
    expect(exception.name).toBe('SampleDomainException');
  });
});

describe('DomainExceptionFilter', () => {
  it('maps the business code to the registered HTTP status', () => {
    const json = jest.fn();
    const status = jest.fn((statusCode: number) => ({ json, statusCode }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new DomainExceptionFilter().catch(new SampleDomainException(), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
      message: 'Sample business failure',
    });
  });
});
