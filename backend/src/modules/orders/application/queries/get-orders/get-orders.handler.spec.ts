import { describe, expect, it, jest } from '@jest/globals';
import { Order } from '../../../domain/order.aggregate';
import { OrderLine } from '../../../domain/order-line.entity';
import { OrderPaymentStatus } from '../../../domain/enums/order-payment-status.enum';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import type { OrderPage } from '../../../domain/orders.repository';
import { GetOrdersHandler } from './get-orders.handler';
import { GetOrdersQuery } from './get-orders.query';
import { encodeOrderCursor } from './order.cursor';

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
    shippingFee: 25000n,
    note: null,
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

const setup = (page: OrderPage) => {
  const findPage = jest
    .fn<(filters: unknown) => Promise<OrderPage>>()
    .mockResolvedValue(page);
  const handler = new GetOrdersHandler({ findPage } as never);

  return { handler, findPage };
};

describe('GetOrdersHandler', () => {
  it('maps a cursor page with stringified money and next cursor', async () => {
    const { handler, findPage } = setup({
      items: [order()],
      hasMore: true,
    });

    const result = await handler.execute(
      new GetOrdersQuery(USER_ID, OrderStatus.CONFIRMED, undefined, 10),
    );

    expect(findPage).toHaveBeenCalledWith({
      userId: USER_ID,
      status: OrderStatus.CONFIRMED,
      limit: 10,
    });
    expect(result).toMatchObject({
      hasMore: true,
      nextCursor: encodeOrderCursor(order()),
      limit: 10,
    });
    expect(result.items[0]).toMatchObject({
      id: ORDER_ID,
      checkoutId: CHECKOUT_ID,
      status: OrderStatus.CONFIRMED,
      paymentStatus: OrderPaymentStatus.UNPAID,
      itemCount: 1,
      totalQuantity: 2,
      itemsAmount: '50000',
      shippingFee: '25000',
      totalAmount: '75000',
      createdAt: CREATED_AT,
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

  it('decodes the cursor into a keyset filter', async () => {
    const { handler, findPage } = setup({ items: [], hasMore: false });
    const cursor = encodeOrderCursor(order());

    await handler.execute(new GetOrdersQuery(USER_ID, 'all', cursor));

    expect(findPage).toHaveBeenCalledWith({
      userId: USER_ID,
      status: 'all',
      limit: 20,
      before: { createdAt: CREATED_AT, id: ORDER_ID },
    });
  });

  it('rejects an invalid cursor', async () => {
    const { handler } = setup({ items: [], hasMore: false });

    await expect(
      handler.execute(new GetOrdersQuery(USER_ID, 'all', 'not-a-cursor')),
    ).rejects.toThrow();
  });
});
