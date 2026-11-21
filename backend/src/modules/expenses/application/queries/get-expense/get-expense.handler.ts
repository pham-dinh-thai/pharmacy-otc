import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExpenseNotFoundException } from '../../../domain/exceptions/expense.exceptions';
import {
  EXPENSES_REPOSITORY,
  type IExpensesRepository,
} from '../../../domain/expenses.repository';
import { expenseToDetail } from '../expense-read-model.factory';
import { ExpenseDetailReadModel } from './expense-detail.read-model';
import { GetExpenseQuery } from './get-expense.query';

@QueryHandler(GetExpenseQuery)
export class GetExpenseHandler implements IQueryHandler<
  GetExpenseQuery,
  ExpenseDetailReadModel
> {
  public constructor(
    @Inject(EXPENSES_REPOSITORY)
    private readonly expensesRepository: IExpensesRepository,
  ) {}

  public async execute(
    query: GetExpenseQuery,
  ): Promise<ExpenseDetailReadModel> {
    const expense = await this.expensesRepository.findById(query.id);

    if (!expense) {
      throw new ExpenseNotFoundException(query.id);
    }

    return expenseToDetail(expense);
  }
}
