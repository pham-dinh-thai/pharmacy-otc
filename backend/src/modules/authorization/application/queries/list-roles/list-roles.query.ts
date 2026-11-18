import { Query } from '@nestjs/cqrs';
import { type TriStateFilter } from '../../../../../shared/utils/list-filters';
import { RolePageReadModel } from './role-page.read-model';

export type ListRolesFilters = {
  page?: number;
  limit?: number;
  search?: string;
  deleted?: TriStateFilter;
  isSuperAdmin?: TriStateFilter;
};

export class ListRolesQuery extends Query<RolePageReadModel> {
  public readonly page: number;
  public readonly limit: number;
  public readonly search: string | undefined;
  public readonly deleted: TriStateFilter;
  public readonly isSuperAdmin: TriStateFilter;

  public constructor(filters: ListRolesFilters = {}) {
    super();

    this.page = Math.max(1, filters.page ?? 1);
    this.limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    this.search = filters.search?.trim() || undefined;
    this.deleted = filters.deleted ?? 'all';
    this.isSuperAdmin = filters.isSuperAdmin ?? 'all';
  }
}
