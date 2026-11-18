import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RoleNotFoundException } from '../../../domain/exceptions/role.exceptions';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../domain/roles.repository';
import { GetRoleQuery } from './get-role.query';
import { RoleReadModel } from './role.read-model';

@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<
  GetRoleQuery,
  RoleReadModel
> {
  public constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  public async execute(query: GetRoleQuery): Promise<RoleReadModel> {
    const role = await this.rolesRepository.findById(query.id);

    if (!role) {
      throw new RoleNotFoundException(query.id);
    }

    return RoleReadModel.fromRole(role);
  }
}
