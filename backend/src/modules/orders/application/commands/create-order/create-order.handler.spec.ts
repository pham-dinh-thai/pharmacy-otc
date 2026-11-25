import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { IssueStockCommand } from '../../../../inventories/application/commands/issue-stock/issue-stock.command';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { Order } from '../../../domain/order.aggregate';
import { OrderLine } from '../../../domain/order-line.entity';
import type { IOrdersRepository } from '../../../domain/orders.repository';
import { CreateOrderCommand } from './create-order.command';
import { CreateOrderHandler } from './create-order.handler';

const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const BATCH_ID = '5d1a8c2e-7b3f-4a61-9c0e-1c2d3e4f5a6b';
const headers = { ...systemActorHeaders(), actorId: USER_ID };

const command = () =>
  new CreateOrderCommand(
    CHECKOUT_ID,
    USER_ID,
    [
      {
        productId: PRODUCT_ID,
        productName: 'Paracetamol 500mg',
        productSku: 'SKU-001',
        unitPrice: 25000n,
        quantity: 3,
      },
    ],
    'Nguyen Van A',
    '1 Nguyen Hue',
    '0901234567',
    30000n,
    'Giao trong gio hanh chinh',
    headers,
  );

const setup = (existing: Order | null = null) => {
  const findByCheckoutId = jest
    .fn<IOrdersRepository['findByCheckoutId']>()
    .mockResolvedValue(existing);
  const create = jest.fn<IOrdersRepository['create']>((value) =>
    Promise.resolve(value),
  );
  const execute = jest.fn<CommandBus['execute']>((issuedCommand) => {
    if (issuedCommand instanceof IssueStockCommand) {
      return Promise.resolve({
        productId: issuedCommand.productId,
        issued: [{ batchId: BATCH_ID, quantity: issuedCommand.quantity }],
      });
    }

    return Promise.resolve({ id: 'audit-id' });
  });
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new CreateOrderHandler(
    { run } as unknown as IUnitOfWork,
    { findByCheckoutId, create } as unknown as IOrdersRepository,
    { execute } as unknown as CommandBus,
  );

  return { handler, findByCheckoutId, create, execute, run };
};

describe('CreateOrderHandler', () => {
  it('creates a pending order, issues stock and records audit inside one UoW', async () => {
    const { handler, findByCheckoutId, create, execute, run } = setup();

    const result = await handler.execute(command());

    expect(run).toHaveBeenCalledTimes(1);
    expect(findByCheckoutId).toHaveBeenCalledWith(CHECKOUT_ID);
    expect(create).toHaveBeenCalledTimes(1);

    const order = create.mock.calls[0][0];
    expect(order.getCheckoutId()).toBe(CHECKOUT_ID);
    expect(order.getUserId()).toBe(USER_ID);
    expect(order.getStatus()).toBe(OrderStatus.PENDING);
    expect(order.getItemsAmount()).toBe(75000n);
    expect(order.getTotalAmount()).toBe(105000n);
    expect(order.getLines()[0]).toMatchObject({
      productId: PRODUCT_ID,
      productName: 'Paracetamol 500mg',
      productSku: 'SKU-001',
    });
    expect(result).toEqual({ id: order.getId() });

    expect(execute).toHaveBeenCalledTimes(2);

    const stockCommand = execute.mock.calls
      .map(([issuedCommand]) => issuedCommand)
      .find(
        (issuedCommand): issuedCommand is IssueStockCommand =>
          issuedCommand instanceof IssueStockCommand,
      );

    expect(stockCommand).toBeInstanceOf(IssueStockCommand);
    expect(stockCommand).toMatchObject({
      productId: PRODUCT_ID,
      quantity: 3,
      headers,
    });

    const auditCommand = execute.mock.calls
      .map(([issuedCommand]) => issuedCommand)
      .find(
        (issuedCommand): issuedCommand is RecordAuditLogCommand =>
          issuedCommand instanceof RecordAuditLogCommand,
      );

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect(auditCommand?.props).toMatchObject({
      actorId: USER_ID,
      action: 'create',
      entityType: EntityType.ORDERS,
      entityId: order.getId(),
      after: {
        status: OrderStatus.PENDING,
        checkoutId: CHECKOUT_ID,
      },
      metadata: {
        checkoutId: CHECKOUT_ID,
        stock: [
          {
            productId: PRODUCT_ID,
            issued: [{ batchId: BATCH_ID, quantity: 3 }],
          },
        ],
      },
    });
  });

  it('returns the existing order for the same checkout without writing or issuing stock', async () => {
    const existing = Order.create({
      checkoutId: CHECKOUT_ID,
      userId: USER_ID,
      lines: [
        OrderLine.create({
          productId: PRODUCT_ID,
          productName: 'Paracetamol 500mg',
          productSku: 'SKU-001',
          unitPrice: 25000n,
          quantity: 1,
        }),
      ],
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      shippingFee: 0n,
      note: null,
    });
    const { handler, create, execute } = setup(existing);

    const result = await handler.execute(command());

    expect(result).toEqual({ id: existing.getId() });
    expect(create).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
