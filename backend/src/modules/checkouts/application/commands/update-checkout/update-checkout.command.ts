import { Command } from '@nestjs/cqrs';
import type { PaymentMethod } from '../../../../../shared/domain/enums/payment-method.enum';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export class UpdateCheckoutCommand extends Command<{ id: string }> {
  public constructor(
    public readonly id: string,
    public readonly shippingName: string,
    public readonly shippingAddress: string,
    public readonly shippingPhone: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
