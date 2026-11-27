import { Query } from '@nestjs/cqrs';
import type { PaymentGatewayReadModel } from './payment-gateway.read-model';

export class GetPaymentGatewayQuery extends Query<PaymentGatewayReadModel> {
  public constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {
    super();
  }
}
