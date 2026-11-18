import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserRoleIdsQuery } from './get-user-role-ids.query';
import { Inject } from '@nestjs/common';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from '../../../domain/users.repository';

@QueryHandler(GetUserRoleIdsQuery)
export class GetUserRoleIdsHandler implements IQueryHandler<GetUserRoleIdsQuery> {
  public constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  public async execute(
    query: GetUserRoleIdsQuery,
  ): Promise<{ id: string; roleIds: string[] }> {
    const user = await this.usersRepository.findById(query.id);

    if (!user) {
      throw new UserNotFoundException(query.id);
    }

    return {
      id: user.getId(),
      roleIds: [...user.getRoleIds()],
    };
  }
}
