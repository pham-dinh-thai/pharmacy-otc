import { Query } from '@nestjs/cqrs';
import { ExpenseDetailReadModel } from './expense-detail.read-model';

export class GetExpenseQuery extends Query<ExpenseDetailReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
