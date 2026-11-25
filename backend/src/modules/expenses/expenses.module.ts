import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EXPENSES_REPOSITORY } from './domain/expenses.repository';
import { MikroExpense } from './infrastructure/entities/mikro-expense.entity';
import { MikroExpensesRepository } from './infrastructure/repositories/mikro-expenses.repository';
import { CreateExpenseHandler } from './application/commands/create-expense/create-expense.handler';
import { UpdateExpenseHandler } from './application/commands/update-expense/update-expense.handler';
import { ApproveExpenseHandler } from './application/commands/approve-expense/approve-expense.handler';
import { PayExpenseHandler } from './application/commands/pay-expense/pay-expense.handler';
import { PaySupplierExpenseHandler } from './application/commands/pay-supplier-expense/pay-supplier-expense.handler';
import { CancelExpenseHandler } from './application/commands/cancel-expense/cancel-expense.handler';
import { GetExpensesHandler } from './application/queries/get-expenses/get-expenses.handler';
import { GetExpenseHandler } from './application/queries/get-expense/get-expense.handler';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { ExpensesController } from './presentation/expenses/expenses.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroExpense]),
    OutBoxModule,
    SecurityModule,
  ],
  controllers: [ExpensesController],
  providers: [
    { provide: EXPENSES_REPOSITORY, useClass: MikroExpensesRepository },
    CreateExpenseHandler,
    UpdateExpenseHandler,
    ApproveExpenseHandler,
    PayExpenseHandler,
    PaySupplierExpenseHandler,
    CancelExpenseHandler,
    GetExpensesHandler,
    GetExpenseHandler,
  ],
  exports: [EXPENSES_REPOSITORY],
})
export class ExpensesModule {}
