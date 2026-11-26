import type { OrderPaymentStatus } from '../../../domain/enums/order-payment-status.enum';
import type { OrderStatus } from '../../../domain/enums/order-status.enum';
import type { OrderLineReadModel } from '../get-orders/order-line.read-model';

export class OrderDetailReadModel {
  public constructor(
    public readonly id: string,
    public readonly checkoutId: string,
    public readonly status: OrderStatus,
    public readonly paymentStatus: OrderPaymentStatus,
    public readonly shippingName: string,
    public readonly shippingAddress: string,
    public readonly shippingPhone: string,
    public readonly note: string | null,
    public readonly itemCount: number,
    public readonly totalQuantity: number,
    public readonly itemsAmount: string,
    public readonly shippingFee: string,
    public readonly totalAmount: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly confirmedAt: Date | null,
    public readonly deliveringAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly cancelledAt: Date | null,
    public readonly failedAt: Date | null,
    public readonly paidAt: Date | null,
    public readonly lines: OrderLineReadModel[],
  ) {}
}
