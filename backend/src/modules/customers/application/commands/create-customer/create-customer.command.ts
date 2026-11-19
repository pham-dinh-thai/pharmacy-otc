import { Command } from '@nestjs/cqrs';
import type { CustomerProfileInput } from '../../../domain/customer.aggregate';

export class CreateCustomerCommand extends Command<{ id: string }> {
  public constructor(
    public readonly userId: string,
    public readonly profile: CustomerProfileInput,
  ) {
    super();
  }
}
