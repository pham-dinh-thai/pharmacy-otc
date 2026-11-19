import { Query } from '@nestjs/cqrs';
import type { TriStateFilter } from '../../../../../shared/utils/list-filters';
import { CustomerPageReadModel } from '../customer-page.read-model';

export type GetCustomersFilters = {
  page?: number;
  limit?: number;
  search?: string;
  deleted?: TriStateFilter;
};

export class GetCustomersQuery extends Query<CustomerPageReadModel> {
  public readonly page: number;
  public readonly limit: number;
  public readonly search: string | undefined;
  public readonly deleted: TriStateFilter;

  public constructor(filters: GetCustomersFilters = {}) {
    super();

    this.page = Math.max(1, filters.page ?? 1);
    this.limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    this.search = filters.search?.trim() || undefined;
    this.deleted = filters.deleted ?? 'all';
  }
}
