import { Query } from '@nestjs/cqrs';
import { ExpenseCategory } from '../../../domain/enums/expense-category.enum';
import { ExpenseStatus } from '../../../domain/enums/expense-status.enum';
import { ExpenseListPageReadModel } from './expense-list-page.read-model';

export class GetExpensesQuery extends Query<ExpenseListPageReadModel> {
  public constructor(
    public readonly search?: string,
    public readonly status: ExpenseStatus | 'all' = 'all',
    public readonly category: ExpenseCategory | 'all' = 'all',
    public readonly supplierId?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();
  }
}
