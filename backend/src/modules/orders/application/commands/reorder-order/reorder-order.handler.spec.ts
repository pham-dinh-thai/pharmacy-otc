import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { AddCartItemsCommand } from '../../../../carts/application/commands/add-cart-items/add-cart-items.command';
import { Order } from '../../../domain/order.aggregate';
import { OrderLine } from '../../../domain/order-line.entity';
import { OrderPaymentStatus } from '../../../domain/enums/order-payment-status.enum';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import type { IOrdersRepository } from '../../../domain/orders.repository';
import { ReorderOrderCommand } from './reorder-order.command';
import { ReorderOrderHandler } from './reorder-order.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const order = (): Order =>
  Order.fromPersistent({
    id: ORDER_ID,
    checkoutId: '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6d',
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
    note: null,
    status: OrderStatus.COMPLETED,
    paymentStatus: OrderPaymentStatus.PAID,
    confirmedAt: NOW,
    deliveringAt: NOW,
    completedAt: NOW,
    cancelledAt: null,
    failedAt: null,
    paidAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  });

const setup = (current: Order | null) => {
  const findById = jest
    .fn<IOrdersRepository['findById']>()
    .mockResolvedValue(current);
  const execute = jest
    .fn<CommandBus['execute']>()
    .mockResolvedValue({ id: 'cart-id', totalItems: 2 });
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new ReorderOrderHandler(
    { run } as unknown as IUnitOfWork,
    { findById } as unknown as IOrdersRepository,
    { execute } as unknown as CommandBus,
  );

  return { handler, findById, execute, run };
};

describe('ReorderOrderHandler', () => {
  it('adds all purchased lines to the authenticated user cart', async () => {
    const { handler, findById, execute, run } = setup(order());

    await expect(
      handler.execute(new ReorderOrderCommand(ORDER_ID, USER_ID)),
    ).resolves.toEqual({ id: 'cart-id', totalItems: 2 });

    expect(run).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(ORDER_ID);
    expect(execute).toHaveBeenCalledWith(
      new AddCartItemsCommand({ userId: USER_ID }, [
        { productId: PRODUCT_ID, quantity: 2 },
      ]),
    );
  });

  it('rejects an order owned by another user', async () => {
    const { handler, execute } = setup(order());

    await expect(
      handler.execute(new ReorderOrderCommand(ORDER_ID, 'another-user-id')),
    ).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });
});
