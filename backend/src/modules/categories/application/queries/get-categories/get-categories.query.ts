import { Query } from '@nestjs/cqrs';
import type { TriStateFilter } from '../../../../../shared/utils/list-filters';
import { CategoryListPageReadModel } from './category-list-page.read-model';

export class GetCategoriesQuery extends Query<CategoryListPageReadModel> {
  public readonly page: number;
  public readonly limit: number;

  public constructor(
    public readonly search?: string,
    public readonly deleted?: TriStateFilter,
    page?: number,
    limit?: number,
  ) {
    super();
    this.page = Math.max(1, page ?? 1);
    this.limit = Math.min(100, Math.max(1, limit ?? 20));
  }
}
