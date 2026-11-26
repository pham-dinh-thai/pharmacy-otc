import type { OrderPaymentStatus } from '../../../domain/enums/order-payment-status.enum';
import type { OrderStatus } from '../../../domain/enums/order-status.enum';
import type { OrderLineReadModel } from './order-line.read-model';

export class OrderListItemReadModel {
  public constructor(
    public readonly id: string,
    public readonly checkoutId: string,
    public readonly status: OrderStatus,
    public readonly paymentStatus: OrderPaymentStatus,
    public readonly itemCount: number,
    public readonly totalQuantity: number,
    public readonly itemsAmount: string,
    public readonly shippingFee: string,
    public readonly totalAmount: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lines: OrderLineReadModel[],
  ) {}
}
