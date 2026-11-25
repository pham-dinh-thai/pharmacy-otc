import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
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

    private readonly commandBus: CommandBus,

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

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'pay',
            entityType: EntityType.EXPENSES,
            entityId: expense.getId(),
            before: { status: previousStatus },
            after: expenseSnapshot(expense),
          }),
        ),
      );

      return { id: expense.getId() };
    });
  }
}
