import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../domain/roles.repository';
import { ListRolesQuery } from './list-roles.query';
import { RoleListItemReadModel } from './role-list-item.read-model';
import { RolePageReadModel } from './role-page.read-model';

@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<
  ListRolesQuery,
  RolePageReadModel
> {
  public constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  public async execute(query: ListRolesQuery): Promise<RolePageReadModel> {
    const { page, limit, search, deleted, isSuperAdmin } = query;
    const result = await this.rolesRepository.findPage({
      limit,
      offset: (page - 1) * limit,
      search,
      deleted,
      isSuperAdmin,
    });

    return new RolePageReadModel(
      result.items.map((role) => RoleListItemReadModel.fromRole(role)),
      result.total,
      page,
      limit,
    );
  }
}
