import { describe, expect, it, jest } from '@jest/globals';
import { type EntityManager } from '@mikro-orm/core';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { MikroOrder } from '../entities/mikro-order.entity';
import { MikroOrdersRepository } from './mikro-orders.repository';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');

const setup = () => {
  const find = jest.fn<
    (entity: unknown, where: unknown, options: unknown) => Promise<unknown[]>
  >(() => Promise.resolve([]));

  return {
    repository: new MikroOrdersRepository({ find } as unknown as EntityManager),
    find,
  };
};

describe('MikroOrdersRepository.findPage', () => {
  it('filters by user and status with a descending keyset order', async () => {
    const { repository, find } = setup();

    await expect(
      repository.findPage({
        userId: USER_ID,
        status: OrderStatus.CONFIRMED,
        limit: 20,
      }),
    ).resolves.toEqual({ items: [], hasMore: false });

    expect(find).toHaveBeenCalledWith(
      MikroOrder,
      { userId: USER_ID, status: OrderStatus.CONFIRMED },
      { orderBy: { createdAt: 'desc', id: 'desc' }, limit: 21 },
    );
  });

  it('applies the createdAt + id cursor as a strict keyset filter', async () => {
    const { repository, find } = setup();

    await repository.findPage({
      userId: USER_ID,
      limit: 10,
      before: { createdAt: CREATED_AT, id: ORDER_ID },
    });

    expect(find).toHaveBeenCalledWith(
      MikroOrder,
      {
        $and: [
          { userId: USER_ID },
          {
            $or: [
              { createdAt: { $lt: CREATED_AT } },
              { createdAt: CREATED_AT, id: { $lt: ORDER_ID } },
            ],
          },
        ],
      },
      { orderBy: { createdAt: 'desc', id: 'desc' }, limit: 11 },
    );
  });
});
