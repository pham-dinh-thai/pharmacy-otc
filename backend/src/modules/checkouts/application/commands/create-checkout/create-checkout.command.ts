import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export class CreateCheckoutCommand extends Command<{ id: string }> {
  public constructor(
    public readonly userId: string,
    public readonly productIds: string[],
    public readonly shippingName: string,
    public readonly shippingAddress: string,
    public readonly shippingPhone: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
