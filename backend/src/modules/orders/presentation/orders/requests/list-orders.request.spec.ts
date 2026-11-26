import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from '@jest/globals';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { ListOrdersRequest } from './list-orders.request';

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(ListOrdersRequest, payload);

  return { instance, errors: await validate(instance, { whitelist: true }) };
};

describe('ListOrdersRequest', () => {
  it('defaults status to all', async () => {
    const { instance, errors } = await validateRequest({});

    expect(errors).toHaveLength(0);
    expect(instance.status).toBe('all');
  });

  it('parses status, cursor and limit', async () => {
    const { instance, errors } = await validateRequest({
      status: 'delivering',
      cursor: 'next-cursor',
      limit: '10',
    });

    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({
      status: OrderStatus.DELIVERING,
      cursor: 'next-cursor',
      limit: 10,
    });
  });

  it('rejects unknown statuses and excessive limits', async () => {
    const invalidStatus = await validateRequest({ status: 'shipped' });
    const invalidLimit = await validateRequest({ limit: '101' });

    expect(invalidStatus.errors).toHaveLength(1);
    expect(invalidLimit.errors).toHaveLength(1);
  });
});
