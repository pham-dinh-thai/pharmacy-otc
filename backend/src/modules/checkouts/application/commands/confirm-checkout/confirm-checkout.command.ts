import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';
import type { PaymentProvider } from '../../../../payments/domain/enums/payment-provider.enum';
import type { CheckoutStatus } from '../../../domain/enums/checkout-status.enum';

export type ConfirmCheckoutResult = {
  id: string;
  status: CheckoutStatus;
  orderId: string;
  paymentMode: 'online' | 'offline';
  provider: PaymentProvider | null;
};

export class ConfirmCheckoutCommand extends Command<ConfirmCheckoutResult> {
  public constructor(
    public readonly id: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
