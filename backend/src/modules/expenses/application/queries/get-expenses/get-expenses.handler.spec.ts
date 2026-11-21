import { describe, expect, it, jest } from '@jest/globals';
import { Expense } from '../../../domain/expense.aggregate';
import { ExpenseCategory } from '../../../domain/enums/expense-category.enum';
import { ExpenseStatus } from '../../../domain/enums/expense-status.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { GetExpensesHandler } from './get-expenses.handler';
import { GetExpensesQuery } from './get-expenses.query';

const ID = 'd440beec-63a5-47b5-bee0-9def3eb30f7c';
const SUPPLIER_ID = '2c7c7a2e-6f5a-4b4b-8a3e-1c9d2e3f4a5b';
const NOW = new Date('2026-11-01T00:00:00.000Z');

const expense = (): Expense =>
  Expense.fromPersistent({
    id: ID,
    name: 'Office rent',
    category: ExpenseCategory.RENT,
    amount: 5000000n,
    expenseDate: new Date('2026-11-01'),
    supplierId: SUPPLIER_ID,
    status: ExpenseStatus.PENDING,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    note: 'November rent',
    createdBy: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('GetExpensesHandler', () => {
  it('maps the repository page with filters and offset', async () => {
    const findPage = jest
      .fn<(filters: unknown) => Promise<{ items: Expense[]; total: number }>>()
      .mockResolvedValue({ items: [expense()], total: 1 });
    const handler = new GetExpensesHandler({ findPage } as never);

    const result = await handler.execute(
      new GetExpensesQuery(
        'rent',
        ExpenseStatus.PENDING,
        ExpenseCategory.RENT,
        SUPPLIER_ID,
        2,
        10,
      ),
    );

    expect(findPage).toHaveBeenCalledWith({
      search: 'rent',
      status: ExpenseStatus.PENDING,
      category: ExpenseCategory.RENT,
      supplierId: SUPPLIER_ID,
      limit: 10,
      offset: 10,
    });
    expect(result).toMatchObject({ total: 1, page: 2, limit: 10 });
    expect(result.items[0]).toMatchObject({
      id: ID,
      name: 'Office rent',
      amount: 5000000,
      status: ExpenseStatus.PENDING,
    });
  });

  it('clamps page and limit before querying', async () => {
    const findPage = jest
      .fn<(filters: unknown) => Promise<{ items: Expense[]; total: number }>>()
      .mockResolvedValue({ items: [], total: 0 });
    const handler = new GetExpensesHandler({ findPage } as never);

    await handler.execute(
      new GetExpensesQuery(undefined, 'all', 'all', undefined, 0, 500),
    );

    expect(findPage).toHaveBeenCalledWith({
      search: undefined,
      status: 'all',
      category: 'all',
      supplierId: undefined,
      limit: 100,
      offset: 0,
    });
  });
});
