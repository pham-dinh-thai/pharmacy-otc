import type { PaymentProvider } from '../../../domain/enums/payment-provider.enum';
import type { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import type { PaymentGateway } from '../../../domain/payment.aggregate';

export class PaymentGatewayReadModel {
  public constructor(
    public readonly orderId: string,
    public readonly provider: PaymentProvider,
    public readonly status: PaymentStatus,
    public readonly amount: string,
    public readonly transactionRef: string,
    public readonly gateway: PaymentGateway,
  ) {}
}
