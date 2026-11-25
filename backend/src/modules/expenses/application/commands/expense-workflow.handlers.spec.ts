import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { IUnitOfWork } from '../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../audit-logs/domain/enums/entity-type.enum';
import { Expense } from '../../domain/expense.aggregate';
import { ExpenseCategory } from '../../domain/enums/expense-category.enum';
import { ExpenseStatus } from '../../domain/enums/expense-status.enum';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import {
  ExpenseInvalidStatusException,
  ExpenseNotFoundException,
} from '../../domain/exceptions/expense.exceptions';
import { IExpensesRepository } from '../../domain/expenses.repository';
import { ApproveExpenseCommand } from './approve-expense/approve-expense.command';
import { ApproveExpenseHandler } from './approve-expense/approve-expense.handler';
import { CancelExpenseCommand } from './cancel-expense/cancel-expense.command';
import { CancelExpenseHandler } from './cancel-expense/cancel-expense.handler';
import { PayExpenseCommand } from './pay-expense/pay-expense.command';
import { PayExpenseHandler } from './pay-expense/pay-expense.handler';
import { PaySupplierExpenseCommand } from './pay-supplier-expense/pay-supplier-expense.command';
import { PaySupplierExpenseHandler } from './pay-supplier-expense/pay-supplier-expense.handler';

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
  const commandBus = { execute } as unknown as CommandBus;
  const unitOfWork: IUnitOfWork = {
    run: run as unknown as IUnitOfWork['run'],
  };

  return {
    repository,
    commandBus,
    unitOfWork,
    findById,
    update,
    execute,
  };
};

describe('Expense workflow handlers', () => {
  it.each([
    {
      label: 'approve',
      from: ExpenseStatus.PENDING,
      to: ExpenseStatus.APPROVED,
      action: 'approve',
      createHandler: (deps: ReturnType<typeof setup>) =>
        new ApproveExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new ApproveExpenseCommand(ID, headers),
    },
    {
      label: 'pay supplier',
      from: ExpenseStatus.APPROVED,
      to: ExpenseStatus.SUPPLIER_PAID,
      action: 'pay',
      createHandler: (deps: ReturnType<typeof setup>) =>
        new PaySupplierExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new PaySupplierExpenseCommand(ID, headers),
    },
    {
      label: 'pay',
      from: ExpenseStatus.SUPPLIER_PAID,
      to: ExpenseStatus.PAID,
      action: 'pay',
      createHandler: (deps: ReturnType<typeof setup>) =>
        new PayExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new PayExpenseCommand(ID, headers),
    },
    {
      label: 'cancel',
      from: ExpenseStatus.PENDING,
      to: ExpenseStatus.CANCELLED,
      action: 'cancel',
      createHandler: (deps: ReturnType<typeof setup>) =>
        new CancelExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new CancelExpenseCommand(ID, headers),
    },
  ])('transitions an expense with $label', async (scenario) => {
    const deps = setup(expense(scenario.from));
    const handler = scenario.createHandler(deps);

    const result = await (
      handler as unknown as {
        execute(command: unknown): Promise<{ id: string }>;
      }
    ).execute(scenario.command);

    expect(result).toEqual({ id: ID });
    expect(deps.findById).toHaveBeenCalledWith(ID, { forUpdate: true });
    expect(deps.update).toHaveBeenCalledTimes(1);
    expect(deps.update.mock.calls[0][0].getStatus()).toBe(scenario.to);
    expect(deps.execute).toHaveBeenCalledTimes(1);

    const auditCommand = deps.execute.mock.calls[0][0];
    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      actorType: 'user',
      actorLabel: 'admin@example.com',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      status: 'success',
      action: scenario.action,
      entityType: EntityType.EXPENSES,
      entityId: ID,
      before: { status: scenario.from },
      after: expect.objectContaining({ status: scenario.to }),
    });
  });

  it.each([
    {
      label: 'approve a paid expense',
      current: ExpenseStatus.PAID,
      createHandler: (deps: ReturnType<typeof setup>) =>
        new ApproveExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new ApproveExpenseCommand(ID, headers),
    },
    {
      label: 'pay a pending expense to the supplier',
      current: ExpenseStatus.PENDING,
      createHandler: (deps: ReturnType<typeof setup>) =>
        new PaySupplierExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new PaySupplierExpenseCommand(ID, headers),
    },
    {
      label: 'pay an approved expense before paying the supplier',
      current: ExpenseStatus.APPROVED,
      createHandler: (deps: ReturnType<typeof setup>) =>
        new PayExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new PayExpenseCommand(ID, headers),
    },
    {
      label: 'cancel an expense paid to the supplier',
      current: ExpenseStatus.SUPPLIER_PAID,
      createHandler: (deps: ReturnType<typeof setup>) =>
        new CancelExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new CancelExpenseCommand(ID, headers),
    },
    {
      label: 'cancel a paid expense',
      current: ExpenseStatus.PAID,
      createHandler: (deps: ReturnType<typeof setup>) =>
        new CancelExpenseHandler(
          deps.repository,
          deps.commandBus,
          deps.unitOfWork,
        ),
      command: new CancelExpenseCommand(ID, headers),
    },
  ])('rejects an attempt to $label', async (scenario) => {
    const deps = setup(expense(scenario.current));
    const handler = scenario.createHandler(deps);

    await expect(
      (
        handler as unknown as {
          execute(command: unknown): Promise<{ id: string }>;
        }
      ).execute(scenario.command),
    ).rejects.toThrow(ExpenseInvalidStatusException);

    expect(deps.update).not.toHaveBeenCalled();
    expect(deps.execute).not.toHaveBeenCalled();
  });

  it('throws a domain 404 when the expense does not exist', async () => {
    const deps = setup(null);
    const handler = new PayExpenseHandler(
      deps.repository,
      deps.commandBus,
      deps.unitOfWork,
    );

    await expect(
      handler.execute(new PayExpenseCommand(ID, headers)),
    ).rejects.toThrow(ExpenseNotFoundException);
  });
});
