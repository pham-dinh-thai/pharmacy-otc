import { describe, expect, it, jest } from '@jest/globals';
import { Order } from '../../../domain/order.aggregate';
import { OrderLine } from '../../../domain/order-line.entity';
import { OrderPaymentStatus } from '../../../domain/enums/order-payment-status.enum';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import type { IOrdersRepository } from '../../../domain/orders.repository';
import { GetOrderByIdHandler } from './get-order-by-id.handler';
import { GetOrderByIdQuery } from './get-order-by-id.query';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';
const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6d';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');

const order = (): Order =>
  Order.fromPersistent({
    id: ORDER_ID,
    checkoutId: CHECKOUT_ID,
    userId: USER_ID,
    lines: [
      OrderLine.fromPersistent({
        id: '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6e',
        productId: PRODUCT_ID,
        productName: 'Paracetamol 500mg',
        productSku: 'SKU-001',
        unitPrice: 25000n,
        quantity: 2,
      }),
    ],
    shippingName: 'Nguyen Van A',
    shippingAddress: '1 Nguyen Hue',
    shippingPhone: '0901234567',
    shippingFee: 0n,
    note: 'Giao trong giờ hành chính',
    status: OrderStatus.CONFIRMED,
    paymentStatus: OrderPaymentStatus.UNPAID,
    confirmedAt: CREATED_AT,
    deliveringAt: null,
    completedAt: null,
    cancelledAt: null,
    failedAt: null,
    paidAt: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  });

const setup = (current: Order | null) => {
  const findById = jest
    .fn<IOrdersRepository['findById']>()
    .mockResolvedValue(current);
  const handler = new GetOrderByIdHandler({ findById } as never);

  return { handler, findById };
};

describe('GetOrderByIdHandler', () => {
  it('maps the owned order with shipping details, totals and lines', async () => {
    const { handler, findById } = setup(order());

    const result = await handler.execute(
      new GetOrderByIdQuery(ORDER_ID, USER_ID),
    );

    expect(findById).toHaveBeenCalledWith(ORDER_ID);
    expect(result).toMatchObject({
      id: ORDER_ID,
      checkoutId: CHECKOUT_ID,
      status: OrderStatus.CONFIRMED,
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      note: 'Giao trong giờ hành chính',
      itemCount: 1,
      totalQuantity: 2,
      itemsAmount: '50000',
      shippingFee: '0',
      totalAmount: '50000',
      lines: [
        {
          productId: PRODUCT_ID,
          productName: 'Paracetamol 500mg',
          productSku: 'SKU-001',
          unitPrice: '25000',
          quantity: 2,
          lineTotal: '50000',
        },
      ],
    });
  });

  it('rejects an order owned by another user', async () => {
    const { handler } = setup(order());

    await expect(
      handler.execute(new GetOrderByIdQuery(ORDER_ID, 'another-user-id')),
    ).rejects.toThrow();
  });
});
