import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  RoleDisabledException,
  RoleNotFoundException,
} from '../../../../authorization/domain/exceptions/role.exceptions';
import { UserByIdNotFoundException } from '../../../domain/exceptions/user.exceptions';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from '../../../domain/users.repository';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../../authorization/domain/roles.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { AssignRoleCommand } from './assign-role.command';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(AssignRoleCommand)
export class AssignRoleHandler implements ICommandHandler<AssignRoleCommand> {
  public constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,

    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: AssignRoleCommand,
  ): Promise<{ id: string; roleIds: string[] }> {
    return this.unitOfWork.run(async () => {
      const role = await this.rolesRepository.findById(command.roleId);

      if (!role) {
        throw new RoleNotFoundException(command.roleId);
      }

      if (role.isDeleted()) {
        throw new RoleDisabledException();
      }

      const user = await this.usersRepository.findById(command.userId);

      if (!user) {
        throw new UserByIdNotFoundException(command.userId);
      }

      const previousRoleIds = user.getRoleIds();

      user.assignRole(role.getId());

      await this.usersRepository.update(user);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'assign_role',
            entityType: EntityType.USERS,
            entityId: user.getId(),
            before: { roleIds: previousRoleIds },
            after: { roleIds: user.getRoleIds() },
            metadata: { roleId: role.getId() },
          }),
        ),
      );

      return { id: user.getId(), roleIds: user.getRoleIds() };
    });
  }
}
