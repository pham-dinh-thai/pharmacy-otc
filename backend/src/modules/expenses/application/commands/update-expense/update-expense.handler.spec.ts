import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { Expense } from '../../../domain/expense.aggregate';
import { ExpenseCategory } from '../../../domain/enums/expense-category.enum';
import { ExpenseStatus } from '../../../domain/enums/expense-status.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { ExpenseInvalidStatusException } from '../../../domain/exceptions/expense.exceptions';
import { IExpensesRepository } from '../../../domain/expenses.repository';
import { UpdateExpenseCommand } from './update-expense.command';
import { UpdateExpenseHandler } from './update-expense.handler';

const ID = 'd440beec-63a5-47b5-bee0-9def3eb30f7c';
const NOW = new Date('2026-11-01T00:00:00.000Z');
const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const expense = (status: ExpenseStatus): Expense =>
  Expense.fromPersistent({
    id: ID,
    name: 'Office rent',
    category: ExpenseCategory.RENT,
    amount: 5000000n,
    expenseDate: new Date('2026-11-01'),
    supplierId: null,
    status,
    paymentMethod: PaymentMethod.CASH,
    note: null,
    createdBy: headers.actorId,
    createdAt: NOW,
    updatedAt: NOW,
  });

const command = () =>
  new UpdateExpenseCommand(
    ID,
    'Updated rent',
    ExpenseCategory.UTILITIES,
    6000000n,
    new Date('2026-11-02'),
    null,
    PaymentMethod.CARD,
    'Updated note',
    headers,
  );

const setup = (current: Expense | null) => {
  const findById = jest
    .fn<
      (id: string, options?: { forUpdate?: boolean }) => Promise<Expense | null>
    >()
    .mockResolvedValue(current);
  const update = jest
    .fn<(value: Expense) => Promise<Expense>>()
    .mockImplementation((value) => Promise.resolve(value));
  const execute = jest.fn<CommandBus['execute']>(() =>
    Promise.resolve({ id: 'audit-id' }),
  );
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const repository: IExpensesRepository = {
    findAll: jest.fn<IExpensesRepository['findAll']>(),
    findPage: jest.fn<IExpensesRepository['findPage']>(),
    findById,
    create: jest.fn<IExpensesRepository['create']>(),
    update,
  };
  const unitOfWork: IUnitOfWork = {
    run: run as unknown as IUnitOfWork['run'],
  };
  const handler = new UpdateExpenseHandler(
    repository,
    { execute } as unknown as CommandBus,
    unitOfWork,
  );

  return { handler, findById, update, execute, run };
};

describe('UpdateExpenseHandler', () => {
  it('updates a pending expense and records before/after audit data', async () => {
    const { handler, findById, update, execute, run } = setup(
      expense(ExpenseStatus.PENDING),
    );

    const result = await handler.execute(command());

    expect(result).toEqual({ id: ID });
    expect(run).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(ID, { forUpdate: true });
    expect(update).toHaveBeenCalledTimes(1);

    const saved = update.mock.calls[0][0];
    expect(saved.getName()).toBe('Updated rent');
    expect(saved.getAmount()).toBe(6000000n);
    expect(saved.getCategory()).toBe(ExpenseCategory.UTILITIES);
    expect(saved.getStatus()).toBe(ExpenseStatus.PENDING);

    expect(execute).toHaveBeenCalledTimes(1);
    const auditCommand = execute.mock.calls[0][0];
    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      actorType: 'user',
      actorLabel: 'admin@example.com',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      status: 'success',
      action: 'update',
      entityType: EntityType.EXPENSES,
      entityId: ID,
      before: expect.objectContaining({
        name: 'Office rent',
        amount: 5000000,
      }),
      after: expect.objectContaining({
        name: 'Updated rent',
        amount: 6000000,
      }),
    });
  });

  it('rejects updates to a paid expense', async () => {
    const { handler, update, execute } = setup(expense(ExpenseStatus.PAID));

    await expect(handler.execute(command())).rejects.toThrow(
      ExpenseInvalidStatusException,
    );

    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
