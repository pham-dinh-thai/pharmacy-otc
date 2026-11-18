import { Query } from '@nestjs/cqrs';
import { RolePageReadModel } from './role-page.read-model';

export class ListRolesQuery extends Query<RolePageReadModel> {
  public readonly page: number;
  public readonly limit: number;

  public constructor(page?: number, limit?: number) {
    super();

    this.page = Math.max(1, page ?? 1);
    this.limit = Math.min(100, Math.max(1, limit ?? 20));
  }
}
