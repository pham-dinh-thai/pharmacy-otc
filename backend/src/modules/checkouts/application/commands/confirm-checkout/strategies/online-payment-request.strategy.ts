import type { ActorHeaders } from '../../../../../../shared/types/actor-headers';
import type { PaymentMethod } from '../../../../../../shared/domain/enums/payment-method.enum';
import type { PaymentProvider } from '../../../../../payments/domain/enums/payment-provider.enum';
import type { PaymentGateway } from '../../../../../payments/domain/payment.aggregate';

export type PaymentRequestInput = {
  orderId: string;
  amount: bigint;
  headers: ActorHeaders;
};

export type PaymentRequestResult = {
  provider: PaymentProvider;
  transactionRef: string;
  gateway: PaymentGateway;
};

export interface IOnlinePaymentRequestStrategy {
  readonly paymentMethod: PaymentMethod;
  buildRequest(input: PaymentRequestInput): Promise<PaymentRequestResult>;
}

export const ONLINE_PAYMENT_REQUEST_STRATEGIES =
  'IOnlinePaymentRequestStrategy[]';
