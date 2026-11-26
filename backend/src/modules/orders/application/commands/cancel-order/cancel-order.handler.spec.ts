import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { AuditLog } from '../../../../audit-logs/domain/audit-log.aggregate';
import type { IAuditLogsRepository } from '../../../../audit-logs/domain/audit-logs.repository';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { RestockStockCommand } from '../../../../inventories/application/commands/restock-stock/restock-stock.command';
import { Order } from '../../../domain/order.aggregate';
import { OrderLine } from '../../../domain/order-line.entity';
import { OrderPaymentStatus } from '../../../domain/enums/order-payment-status.enum';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import type { IOrdersRepository } from '../../../domain/orders.repository';
import { CancelOrderCommand } from './cancel-order.command';
import { CancelOrderHandler } from './cancel-order.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';
const BATCH_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6e';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const NOW = new Date('2026-01-01T00:00:00.000Z');
const headers = systemActorHeaders();

const order = (status = OrderStatus.CONFIRMED): Order =>
  Order.fromPersistent({
    id: ORDER_ID,
    checkoutId: '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6d',
    userId: USER_ID,
    lines: [
      OrderLine.fromPersistent({
        id: '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6f',
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
    status,
    paymentStatus: OrderPaymentStatus.UNPAID,
    confirmedAt: NOW,
    deliveringAt: null,
    completedAt: null,
    cancelledAt: null,
    failedAt: null,
    paidAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  });

const createAudit = (): AuditLog =>
  AuditLog.create({
    action: 'create',
    entityType: EntityType.ORDERS,
    entityId: ORDER_ID,
    occurredAt: NOW,
    metadata: {
      stock: [
        {
          productId: PRODUCT_ID,
          issued: [{ batchId: BATCH_ID, quantity: 2 }],
        },
      ],
    },
  });

const setup = (current: Order | null, logs: AuditLog[] = [createAudit()]) => {
  const findById = jest
    .fn<IOrdersRepository['findById']>()
    .mockResolvedValue(current);
  const update = jest.fn<IOrdersRepository['update']>((value) =>
    Promise.resolve(value),
  );
  const findByEntity = jest
    .fn<IAuditLogsRepository['findByEntity']>()
    .mockResolvedValue(logs);
  const execute = jest.fn<CommandBus['execute']>(() => Promise.resolve({}));
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new CancelOrderHandler(
    { run } as unknown as IUnitOfWork,
    { findById, update } as unknown as IOrdersRepository,
    { findByEntity } as unknown as IAuditLogsRepository,
    { execute } as unknown as CommandBus,
  );

  return { handler, findById, update, findByEntity, execute, run };
};

describe('CancelOrderHandler', () => {
  it('cancels the order and returns the stock recorded at creation', async () => {
    const current = order();
    const { handler, update, execute, run } = setup(current);

    await expect(
      handler.execute(new CancelOrderCommand(ORDER_ID, USER_ID, headers)),
    ).resolves.toEqual({ id: ORDER_ID, status: OrderStatus.CANCELLED });

    expect(run).toHaveBeenCalledTimes(1);
    expect(current.getStatus()).toBe(OrderStatus.CANCELLED);
    expect(current.getCancelledAt()).toBeInstanceOf(Date);
    expect(update).toHaveBeenCalledWith(current);

    const commands = execute.mock.calls.map(([command]) => command);
    expect(commands).toContainEqual(
      new RestockStockCommand(
        [
          {
            productId: PRODUCT_ID,
            batches: [{ batchId: BATCH_ID, quantity: 2 }],
          },
        ],
        headers,
        ORDER_ID,
      ),
    );

    const auditCommands = commands.filter(
      (command): command is RecordAuditLogCommand =>
        command instanceof RecordAuditLogCommand,
    );
    expect(auditCommands).toHaveLength(1);
    expect(auditCommands[0].props).toMatchObject({
      action: 'cancel',
      entityType: EntityType.ORDERS,
      entityId: ORDER_ID,
      before: { status: OrderStatus.CONFIRMED },
      after: { status: OrderStatus.CANCELLED },
    });
  });

  it('rejects an order owned by another user', async () => {
    const { handler, update, execute } = setup(order());

    await expect(
      handler.execute(
        new CancelOrderCommand(ORDER_ID, 'another-user-id', headers),
      ),
    ).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects an order that can no longer be cancelled', async () => {
    const { handler, update, execute } = setup(order(OrderStatus.COMPLETED));

    await expect(
      handler.execute(new CancelOrderCommand(ORDER_ID, USER_ID, headers)),
    ).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
