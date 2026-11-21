import { describe, expect, it, jest } from '@jest/globals';
import { Expense } from '../../../domain/expense.aggregate';
import { ExpenseCategory } from '../../../domain/enums/expense-category.enum';
import { ExpenseStatus } from '../../../domain/enums/expense-status.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { ExpenseNotFoundException } from '../../../domain/exceptions/expense.exceptions';
import { GetExpenseHandler } from './get-expense.handler';
import { GetExpenseQuery } from './get-expense.query';

const ID = 'd440beec-63a5-47b5-bee0-9def3eb30f7c';
const NOW = new Date('2026-11-01T00:00:00.000Z');

const expense = (): Expense =>
  Expense.fromPersistent({
    id: ID,
    name: 'Office rent',
    category: ExpenseCategory.RENT,
    amount: 5000000n,
    expenseDate: new Date('2026-11-01'),
    supplierId: null,
    status: ExpenseStatus.APPROVED,
    paymentMethod: PaymentMethod.CASH,
    note: null,
    createdBy: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('GetExpenseHandler', () => {
  it('returns the expense detail', async () => {
    const findById = jest
      .fn<(id: string) => Promise<Expense | null>>()
      .mockResolvedValue(expense());
    const handler = new GetExpenseHandler({ findById } as never);

    const result = await handler.execute(new GetExpenseQuery(ID));

    expect(findById).toHaveBeenCalledWith(ID);
    expect(result).toMatchObject({
      id: ID,
      name: 'Office rent',
      status: ExpenseStatus.APPROVED,
      paymentMethod: PaymentMethod.CASH,
    });
  });

  it('throws a domain 404 when the expense does not exist', async () => {
    const findById = jest
      .fn<(id: string) => Promise<Expense | null>>()
      .mockResolvedValue(null);
    const handler = new GetExpenseHandler({ findById } as never);

    await expect(handler.execute(new GetExpenseQuery(ID))).rejects.toThrow(
      ExpenseNotFoundException,
    );
  });
});
