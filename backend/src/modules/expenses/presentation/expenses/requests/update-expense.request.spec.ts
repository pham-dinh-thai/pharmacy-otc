import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateExpenseRequest } from './update-expense.request';

const SUPPLIER_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const validPayload = (): Record<string, unknown> => ({
  name: 'Office rent',
  category: 'rent',
  amount: 5000000,
  expenseDate: '2026-11-01T00:00:00.000Z',
  supplierId: SUPPLIER_ID,
  paymentMethod: 'bank_transfer',
  note: 'November rent',
});

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(UpdateExpenseRequest, payload);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  return { instance, errors };
};

describe('UpdateExpenseRequest', () => {
  it('accepts a full payload and trims the name', async () => {
    const payload = validPayload();
    payload.name = '  Office rent  ';

    const { instance, errors } = await validateRequest(payload);

    expect(errors).toHaveLength(0);
    expect(instance.name).toBe('Office rent');
    expect(instance.expenseDate).toBeInstanceOf(Date);
  });

  it('accepts a payload with only required fields', async () => {
    const { errors } = await validateRequest({
      name: 'Office rent',
      category: 'rent',
      amount: 5000000,
      expenseDate: '2026-11-01T00:00:00.000Z',
    });

    expect(errors).toHaveLength(0);
  });

  it.each([
    { field: 'name', value: '   ' },
    { field: 'category', value: 'unknown' },
    { field: 'amount', value: 1.5 },
    { field: 'expenseDate', value: 'not-a-date' },
    { field: 'supplierId', value: 'not-a-uuid' },
    { field: 'paymentMethod', value: 'unknown' },
    { field: 'note', value: 123 },
  ])('rejects an invalid $field value', async ({ field, value }) => {
    const { errors } = await validateRequest({
      ...validPayload(),
      [field]: value,
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe(field);
  });

  it('rejects an unknown field', async () => {
    const { errors } = await validateRequest({
      ...validPayload(),
      unknown: true,
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('unknown');
  });
});
