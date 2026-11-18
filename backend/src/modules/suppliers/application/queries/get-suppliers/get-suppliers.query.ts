import { Query } from '@nestjs/cqrs';
import { SupplierListPageReadModel } from './supplier-list-page.read-model';

export class GetSuppliersQuery extends Query<SupplierListPageReadModel> {
  public readonly page: number;
  public readonly limit: number;

  public constructor(
    public readonly deleted?: boolean,
    public readonly search?: string,
    page?: number,
    limit?: number,
  ) {
    super();

    this.page = Math.max(1, page ?? 1);
    this.limit = Math.min(100, Math.max(1, limit ?? 20));
  }
}
