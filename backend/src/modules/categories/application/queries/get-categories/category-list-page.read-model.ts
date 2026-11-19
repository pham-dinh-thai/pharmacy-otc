import { CategoryListItemReadModel } from './category-list-item.read-model';

export class CategoryListPageReadModel {
  public constructor(
    public readonly items: CategoryListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
