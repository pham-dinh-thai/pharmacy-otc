import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EXPENSES_REPOSITORY,
  type IExpensesRepository,
} from '../../../domain/expenses.repository';
import { expenseToListItem } from '../expense-read-model.factory';
import { ExpenseListPageReadModel } from './expense-list-page.read-model';
import { GetExpensesQuery } from './get-expenses.query';

@QueryHandler(GetExpensesQuery)
export class GetExpensesHandler implements IQueryHandler<
  GetExpensesQuery,
  ExpenseListPageReadModel
> {
  public constructor(
    @Inject(EXPENSES_REPOSITORY)
    private readonly expensesRepository: IExpensesRepository,
  ) {}

  public async execute(
    query: GetExpensesQuery,
  ): Promise<ExpenseListPageReadModel> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const result = await this.expensesRepository.findPage({
      search: query.search,
      status: query.status,
      category: query.category,
      supplierId: query.supplierId,
      limit,
      offset: (page - 1) * limit,
    });

    return new ExpenseListPageReadModel(
      result.items.map((expense) => expenseToListItem(expense)),
      result.total,
      page,
      limit,
    );
  }
}
