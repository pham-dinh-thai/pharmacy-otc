import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UnprocessableEntityException } from '@nestjs/common';
import { ApproveExpenseCommand } from '../../application/commands/approve-expense/approve-expense.command';
import { CancelExpenseCommand } from '../../application/commands/cancel-expense/cancel-expense.command';
import { CreateExpenseCommand } from '../../application/commands/create-expense/create-expense.command';
import { PayExpenseCommand } from '../../application/commands/pay-expense/pay-expense.command';
import { PaySupplierExpenseCommand } from '../../application/commands/pay-supplier-expense/pay-supplier-expense.command';
import { UpdateExpenseCommand } from '../../application/commands/update-expense/update-expense.command';
import { GetExpenseQuery } from '../../application/queries/get-expense/get-expense.query';
import { GetExpensesQuery } from '../../application/queries/get-expenses/get-expenses.query';
import { ExpenseCategory } from '../../domain/enums/expense-category.enum';
import { ExpenseStatus } from '../../domain/enums/expense-status.enum';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { ExpensesController } from './expenses.controller';
import { CreateExpenseRequest } from './requests/create-expense.request';
import { ListExpensesRequest } from './requests/list-expenses.request';
import { UpdateExpenseRequest } from './requests/update-expense.request';

const EXPENSE_DATE = new Date('2026-11-01T00:00:00.000Z');
const EXPENSE_ID = 'd440beec-63a5-47b5-bee0-9def3eb30f7c';
const SUPPLIER_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const buildRequest = (): CreateExpenseRequest =>
  Object.assign(new CreateExpenseRequest(), {
    name: 'Office rent',
    category: ExpenseCategory.RENT,
    amount: '5000000',
    expenseDate: EXPENSE_DATE,
    supplierId: SUPPLIER_ID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    note: 'November rent',
  });

describe('ExpensesController', () => {
  let execute: jest.Mock<(command: unknown) => Promise<unknown>>;
  let queryExecute: jest.Mock<(query: unknown) => Promise<unknown>>;
  let controller: ExpensesController;

  beforeEach(() => {
    execute = jest
      .fn<(command: unknown) => Promise<unknown>>()
      .mockResolvedValue({ id: 'expense-1' });
    queryExecute = jest
      .fn<(query: unknown) => Promise<unknown>>()
      .mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });

    controller = new ExpensesController(
      { execute } as unknown as CommandBus,
      { execute: queryExecute } as unknown as QueryBus,
    );
  });

  it('dispatches CreateExpenseCommand with actor headers and returns the created id', async () => {
    const result = await controller.create(buildRequest(), headers);

    expect(execute).toHaveBeenCalledTimes(1);

    const command = execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(CreateExpenseCommand);
    expect(command).toMatchObject({
      name: 'Office rent',
      category: ExpenseCategory.RENT,
      amount: '5000000',
      expenseDate: EXPENSE_DATE,
      supplierId: SUPPLIER_ID,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      note: 'November rent',
      createdBy: headers.actorId,
      headers,
    });

    expect(result).toEqual({ id: 'expense-1' });
  });

  it('normalizes omitted optional fields to null', async () => {
    const request = buildRequest();
    request.supplierId = null;
    request.paymentMethod = null;
    request.note = null;

    await controller.create(request, headers);

    const command = execute.mock.calls[0][0] as CreateExpenseCommand;
    expect(command.supplierId).toBeNull();
    expect(command.paymentMethod).toBeNull();
    expect(command.note).toBeNull();
  });

  it('forwards list filters to GetExpensesQuery', async () => {
    const request = Object.assign(new ListExpensesRequest(), {
      search: 'rent',
      status: ExpenseStatus.PENDING,
      category: ExpenseCategory.RENT,
      supplierId: SUPPLIER_ID,
      page: 2,
      limit: 10,
    });

    await controller.findAll(request);

    expect(queryExecute).toHaveBeenCalledWith(
      new GetExpensesQuery(
        'rent',
        ExpenseStatus.PENDING,
        ExpenseCategory.RENT,
        SUPPLIER_ID,
        2,
        10,
      ),
    );
  });

  it('forwards the id to GetExpenseQuery', async () => {
    await controller.findOne(EXPENSE_ID);

    expect(queryExecute).toHaveBeenCalledWith(new GetExpenseQuery(EXPENSE_ID));
  });

  it('dispatches update, approve, supplier payment, pay and cancel commands', async () => {
    const request = Object.assign(new UpdateExpenseRequest(), {
      name: 'Updated rent',
      category: ExpenseCategory.RENT,
      amount: '6000000',
      expenseDate: EXPENSE_DATE,
      supplierId: null,
      paymentMethod: null,
      note: null,
    });

    await controller.update(EXPENSE_ID, request, headers);
    await controller.approve(EXPENSE_ID, headers);
    await controller.paySupplier(EXPENSE_ID, headers);
    await controller.pay(EXPENSE_ID, headers);
    await controller.cancel(EXPENSE_ID, headers);

    expect(execute.mock.calls.map(([command]) => command)).toEqual([
      new UpdateExpenseCommand(
        EXPENSE_ID,
        'Updated rent',
        ExpenseCategory.RENT,
        '6000000',
        EXPENSE_DATE,
        null,
        null,
        null,
        headers,
      ),
      new ApproveExpenseCommand(EXPENSE_ID, headers),
      new PaySupplierExpenseCommand(EXPENSE_ID, headers),
      new PayExpenseCommand(EXPENSE_ID, headers),
      new CancelExpenseCommand(EXPENSE_ID, headers),
    ]);
  });

  it('propagates command errors to the caller', async () => {
    const error = new UnprocessableEntityException('invalid expense');
    execute.mockRejectedValue(error);

    await expect(controller.create(buildRequest(), headers)).rejects.toBe(
      error,
    );

    expect(execute).toHaveBeenCalledTimes(1);
  });
});
