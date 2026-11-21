import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListExpensesRequest } from './list-expenses.request';

const SUPPLIER_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(ListExpensesRequest, payload);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  return { instance, errors };
};

describe('ListExpensesRequest', () => {
  it('defaults status and category to all and converts page/limit to numbers', async () => {
    const { instance, errors } = await validateRequest({
      page: '2',
      limit: '10',
    });

    expect(errors).toHaveLength(0);
    expect(instance.status).toBe('all');
    expect(instance.category).toBe('all');
    expect(instance.page).toBe(2);
    expect(instance.limit).toBe(10);
  });

  it('accepts known filters and trims blank search to null', async () => {
    const { instance, errors } = await validateRequest({
      search: '   ',
      status: 'paid',
      category: 'rent',
      supplierId: SUPPLIER_ID,
    });

    expect(errors).toHaveLength(0);
    expect(instance.search).toBeNull();
    expect(instance.status).toBe('paid');
    expect(instance.category).toBe('rent');
    expect(instance.supplierId).toBe(SUPPLIER_ID);
  });

  it.each([
    { field: 'status', value: 'unknown' },
    { field: 'category', value: 'unknown' },
    { field: 'supplierId', value: 'not-a-uuid' },
    { field: 'page', value: '0' },
    { field: 'limit', value: '101' },
  ])('rejects an invalid $field value', async ({ field, value }) => {
    const { errors } = await validateRequest({ [field]: value });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe(field);
  });
});
