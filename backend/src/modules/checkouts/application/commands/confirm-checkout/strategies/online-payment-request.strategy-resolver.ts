import { Inject, Injectable } from '@nestjs/common';
import { PaymentMethod } from '../../../../../../shared/domain/enums/payment-method.enum';
import { PaymentMethodUnsupportedException } from '../../../../../payments/domain/exceptions/payment.exception';
import {
  IOnlinePaymentRequestStrategy,
  ONLINE_PAYMENT_REQUEST_STRATEGIES,
} from './online-payment-request.strategy';

@Injectable()
export class OnlinePaymentRequestStrategyResolver {
  public constructor(
    @Inject(ONLINE_PAYMENT_REQUEST_STRATEGIES)
    private readonly strategies: IOnlinePaymentRequestStrategy[],
  ) {}

  public resolve(method: PaymentMethod): IOnlinePaymentRequestStrategy {
    const strategy = this.strategies.find(
      (candidate) => candidate.paymentMethod === method,
    );

    if (!strategy) throw new PaymentMethodUnsupportedException(method);

    return strategy;
  }
}
