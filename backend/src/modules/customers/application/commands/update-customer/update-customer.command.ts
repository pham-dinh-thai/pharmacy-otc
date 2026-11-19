import { Command } from '@nestjs/cqrs';
import type { CustomerProfileInput } from '../../../domain/customer.aggregate';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export class UpdateCustomerCommand extends Command<{ id: string }> {
  public constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly profile: CustomerProfileInput,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
