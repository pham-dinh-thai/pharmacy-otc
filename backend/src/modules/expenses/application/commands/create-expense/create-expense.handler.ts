import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  type IExpensesRepository,
  EXPENSES_REPOSITORY,
} from '../../../domain/expenses.repository';
import { Expense } from '../../../domain/expense.aggregate';
import { expenseSnapshot } from '../../../domain/expense.snapshot';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateExpenseCommand } from './create-expense.command';

@CommandHandler(CreateExpenseCommand)
export class CreateExpenseHandler implements ICommandHandler<CreateExpenseCommand> {
  public constructor(
    @Inject(EXPENSES_REPOSITORY)
    private readonly expensesRepository: IExpensesRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: CreateExpenseCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const expense = Expense.create({
        name: command.name,
        category: command.category,
        amount: command.amount,
        expenseDate: command.expenseDate,
        supplierId: command.supplierId,
        paymentMethod: command.paymentMethod,
        note: command.note,
        createdBy: command.createdBy,
      });

      await this.expensesRepository.create(expense);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'create',
            entityType: EntityType.EXPENSES,
            entityId: expense.getId(),
            after: expenseSnapshot(expense),
          }),
        ),
      );

      return { id: expense.getId() };
    });
  }
}
