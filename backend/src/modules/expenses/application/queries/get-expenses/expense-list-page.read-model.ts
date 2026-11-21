import { ExpenseListItemReadModel } from './expense-list-item.read-model';

export class ExpenseListPageReadModel {
  public constructor(
    public readonly items: ExpenseListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
