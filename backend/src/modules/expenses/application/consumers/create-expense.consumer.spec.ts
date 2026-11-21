import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { OutboxConsumerRegistry } from '../../../../shared/modules/outbox/application/outbox-consumer.registry';
import { type OutboxEvent } from '../../../../shared/modules/outbox/domain/outbox.repository';
import { SYSTEM_ACTOR_ID } from '../../../../shared/types/actor-headers';
import {
  GOODS_RECEIPT_CONFIRMED_EXPENSE,
  type GoodsReceiptConfirmedExpensePayload,
} from '../../../goods-receipts/domain/events/goods-receipt-confirmed.event';
import { ExpenseCategory } from '../../domain/enums/expense-category.enum';
import { CreateExpenseCommand } from '../commands/create-expense/create-expense.command';
import { CreateExpenseConsumer } from './create-expense.consumer';

const SUPPLIER_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const EXPENSE_DATE = '2026-11-21T00:00:00.000Z';

const payload: GoodsReceiptConfirmedExpensePayload = {
  name: `Trả tiền cho nhà cung cấp ${SUPPLIER_ID}`,
  category: ExpenseCategory.OTHER,
  amount: 25000,
  expenseDate: EXPENSE_DATE,
  supplierId: SUPPLIER_ID,
  paymentMethod: null,
  note: 'Trả tiền cho phiếu nhập',
};

const setup = () => {
  const execute = jest.fn<(command: CreateExpenseCommand) => Promise<void>>(
    () => Promise.resolve(),
  );
  const registry = new OutboxConsumerRegistry();
  const consumer = new CreateExpenseConsumer(registry, {
    execute,
  } as unknown as CommandBus);

  consumer.onModuleInit();

  const event: OutboxEvent = {
    id: 42,
    eventType: GOODS_RECEIPT_CONFIRMED_EXPENSE,
    payload,
    createdAt: new Date(EXPENSE_DATE),
    processed: false,
    attempts: 0,
    lastError: null,
    failedAt: null,
  };

  return { consumer, execute, registry, event };
};

describe('CreateExpenseConsumer', () => {
  it('registers itself for the goods receipt expense event', () => {
    const { consumer, registry } = setup();

    expect(registry.get(GOODS_RECEIPT_CONFIRMED_EXPENSE)).toBe(consumer);
  });

  it('creates a system-authored expense with bigint amount and Date', async () => {
    const { consumer, execute, event } = setup();

    await consumer.handle(event);

    expect(execute).toHaveBeenCalledTimes(1);

    const command = execute.mock.calls[0][0];

    expect(command).toBeInstanceOf(CreateExpenseCommand);
    expect(command.name).toBe(payload.name);
    expect(command.category).toBe(ExpenseCategory.OTHER);
    expect(command.amount).toBe(25000n);
    expect(command.expenseDate).toEqual(new Date(EXPENSE_DATE));
    expect(command.supplierId).toBe(SUPPLIER_ID);
    expect(command.paymentMethod).toBeNull();
    expect(command.createdBy).toBe(SYSTEM_ACTOR_ID);
    expect(command.headers.actorId).toBe(SYSTEM_ACTOR_ID);
    expect(command.headers.actorType).toBe('system');
  });
});
