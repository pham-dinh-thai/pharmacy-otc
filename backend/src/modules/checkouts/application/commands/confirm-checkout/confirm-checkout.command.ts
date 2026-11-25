import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';
import type { CheckoutStatus } from '../../../domain/enums/checkout-status.enum';

export class ConfirmCheckoutCommand extends Command<{
  id: string;
  status: CheckoutStatus;
  orderId: string;
}> {
  public constructor(
    public readonly id: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
