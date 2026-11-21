import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ExpenseNotFoundException } from '../../../domain/exceptions/expense.exceptions';
import {
  type IExpensesRepository,
  EXPENSES_REPOSITORY,
} from '../../../domain/expenses.repository';
import { expenseSnapshot } from '../../../domain/expense.snapshot';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { PayExpenseCommand } from './pay-expense.command';
import { EXPENSE_PAID_EVENT } from '../../../domain/events/expense-paid.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(PayExpenseCommand)
export class PayExpenseHandler implements ICommandHandler<PayExpenseCommand> {
  public constructor(
    @Inject(EXPENSES_REPOSITORY)
    private readonly expensesRepository: IExpensesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: PayExpenseCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const expense = await this.expensesRepository.findById(command.id, {
        forUpdate: true,
      });

      if (!expense) {
        throw new ExpenseNotFoundException(command.id);
      }

      const previousStatus = expense.getStatus();

      expense.pay();

      await this.expensesRepository.update(expense);

      await this.outboxRepository.create({
        eventType: EXPENSE_PAID_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.EXPENSES,
          entityId: expense.getId(),
          before: { status: previousStatus },
          after: expenseSnapshot(expense),
        }),
      });

      return { id: expense.getId() };
    });
  }
}
