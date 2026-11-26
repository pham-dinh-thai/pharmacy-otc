import { jest } from '@jest/globals';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { systemActorHeaders } from '../../../../shared/types/actor-headers';
import { CancelOrderCommand } from '../../application/commands/cancel-order/cancel-order.command';
import { ReorderOrderCommand } from '../../application/commands/reorder-order/reorder-order.command';
import { GetOrderByIdQuery } from '../../application/queries/get-order-by-id/get-order-by-id.query';
import type { OrderDetailReadModel } from '../../application/queries/get-order-by-id/order-detail.read-model';
import { GetOrdersQuery } from '../../application/queries/get-orders/get-orders.query';
import { OrderListPageReadModel } from '../../application/queries/get-orders/order-list-page.read-model';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrdersController } from './orders.controller';

describe('OrdersController', () => {
  let controller: OrdersController;
  let query: jest.Mock<(query: unknown) => Promise<unknown>>;
  let command: jest.Mock<(command: unknown) => Promise<unknown>>;

  beforeEach(async () => {
    const page = new OrderListPageReadModel([], null, false, 20);
    const detail = { id: 'order-id' } as OrderDetailReadModel;
    query = jest.fn((requested: unknown) =>
      Promise.resolve(requested instanceof GetOrderByIdQuery ? detail : page),
    );
    command = jest.fn(() => Promise.resolve({ id: 'order-id' }));

    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: QueryBus, useValue: { execute: query } },
        { provide: CommandBus, useValue: { execute: command } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(OrdersController);
  });

  it('dispatches the list query scoped to the authenticated user', async () => {
    const headers = systemActorHeaders();

    await expect(
      controller.findAll(
        { status: OrderStatus.PENDING, cursor: 'cursor-value', limit: 10 },
        headers,
      ),
    ).resolves.toMatchObject({ items: [], hasMore: false });

    expect(query).toHaveBeenCalledWith(
      new GetOrdersQuery(
        headers.actorId,
        OrderStatus.PENDING,
        'cursor-value',
        10,
      ),
    );
  });

  it('dispatches the detail query scoped to the authenticated user', async () => {
    const headers = systemActorHeaders();

    await expect(controller.findOne('order-id', headers)).resolves.toEqual({
      id: 'order-id',
    });

    expect(query).toHaveBeenCalledWith(
      new GetOrderByIdQuery('order-id', headers.actorId),
    );
  });

  it('cancels only the order owned by the authenticated user', async () => {
    const headers = systemActorHeaders();

    await controller.cancel('order-id', headers);

    expect(command).toHaveBeenCalledWith(
      new CancelOrderCommand('order-id', headers.actorId, headers),
    );
  });

  it('reorders only the order owned by the authenticated user', async () => {
    const headers = systemActorHeaders();

    await controller.reorder('order-id', headers);

    expect(command).toHaveBeenCalledWith(
      new ReorderOrderCommand('order-id', headers.actorId),
    );
  });
});
