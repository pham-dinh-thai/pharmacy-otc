import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  OUTBOX_REPOSITORY,
  type IOutboxRepository,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EXPENSE_SUPPLIER_PAID_EVENT } from '../../../domain/events/expense-supplier-paid.event';
import { ExpenseNotFoundException } from '../../../domain/exceptions/expense.exceptions';
import {
  EXPENSES_REPOSITORY,
  type IExpensesRepository,
} from '../../../domain/expenses.repository';
import { expenseSnapshot } from '../../../domain/expense.snapshot';
import { PaySupplierExpenseCommand } from './pay-supplier-expense.command';

@CommandHandler(PaySupplierExpenseCommand)
export class PaySupplierExpenseHandler implements ICommandHandler<PaySupplierExpenseCommand> {
  public constructor(
    @Inject(EXPENSES_REPOSITORY)
    private readonly expensesRepository: IExpensesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: PaySupplierExpenseCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const expense = await this.expensesRepository.findById(command.id, {
        forUpdate: true,
      });

      if (!expense) {
        throw new ExpenseNotFoundException(command.id);
      }

      const previousStatus = expense.getStatus();

      expense.paySupplier();

      await this.expensesRepository.update(expense);

      await this.outboxRepository.create({
        eventType: EXPENSE_SUPPLIER_PAID_EVENT,
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
