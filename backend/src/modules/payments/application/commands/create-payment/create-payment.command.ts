import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';
import type { PaymentGateway } from '../../../domain/payment.aggregate';
import type { PaymentProvider } from '../../../domain/enums/payment-provider.enum';

export class CreatePaymentCommand extends Command<{ id: string }> {
  public constructor(
    public readonly orderId: string,
    public readonly provider: PaymentProvider,
    public readonly amount: bigint,
    public readonly transactionRef: string,
    public readonly gateway: PaymentGateway,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
