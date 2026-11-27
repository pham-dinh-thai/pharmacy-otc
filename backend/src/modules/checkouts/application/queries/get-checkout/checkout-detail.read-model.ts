import type { PaymentMethod } from '../../../../../shared/domain/enums/payment-method.enum';
import type { CheckoutStatus } from '../../../domain/enums/checkout-status.enum';
import { CheckoutLineReadModel } from './checkout-line.read-model';

export class CheckoutDetailReadModel {
  public constructor(
    public readonly id: string,
    public readonly status: CheckoutStatus,
    public readonly paymentMethod: PaymentMethod,
    public readonly shippingName: string,
    public readonly shippingAddress: string,
    public readonly shippingPhone: string,
    public readonly amount: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly lines: CheckoutLineReadModel[],
  ) {}
}
