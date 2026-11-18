import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { type Response } from 'express';
import { statusForDomainException } from './domain-exception-codes';
import { DomainException } from './domain.exception';

/**
 * Translates domain/application business errors into the API error envelope.
 * Nest's own HttpExceptions (guards, controllers, infrastructure adapters)
 * keep their default handling.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  public catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = statusForDomainException(exception.code);

    response.status(statusCode).json({
      statusCode,
      code: exception.code,
      message: exception.message,
    });
  }
}
