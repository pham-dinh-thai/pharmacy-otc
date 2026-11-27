import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../../../../../../shared/domain/enums/payment-method.enum';
import { PaymentMethodUnsupportedException } from '../../../../../payments/domain/exceptions/payment.exception';
import {
  IOnlinePaymentRequestStrategy,
  PaymentRequestResult,
} from './online-payment-request.strategy';

@Injectable()
export class ZalopayPaymentRequestStrategy implements IOnlinePaymentRequestStrategy {
  public readonly paymentMethod = PaymentMethod.ZALOPAY;

  public buildRequest(): Promise<PaymentRequestResult> {
    return Promise.reject(
      new PaymentMethodUnsupportedException(this.paymentMethod),
    );
  }
}
