import { Query } from '@nestjs/cqrs';
import type { TriStateFilter } from '../../../../../shared/utils/list-filters';
import { ProductListPageReadModel } from './product-list-page.read-model';

export class GetProductsQuery extends Query<ProductListPageReadModel> {
  public readonly page: number;
  public readonly limit: number;

  public constructor(
    public readonly search?: string,
    public readonly deleted?: TriStateFilter,
    public readonly categoryId?: string,
    public readonly inStock?: TriStateFilter,
    public readonly minPrice?: string,
    public readonly maxPrice?: string,
    page?: number,
    limit?: number,
  ) {
    super();
    this.page = Math.max(1, page ?? 1);
    this.limit = Math.min(100, Math.max(1, limit ?? 20));
  }
}
