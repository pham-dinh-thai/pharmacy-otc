import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UserByIdNotFoundException } from '../../../domain/exceptions/user.exceptions';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from '../../../domain/users.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RemoveRoleCommand } from './remove-role.command';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(RemoveRoleCommand)
export class RemoveRoleHandler implements ICommandHandler<RemoveRoleCommand> {
  public constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: RemoveRoleCommand,
  ): Promise<{ id: string; roleIds: string[] }> {
    return this.unitOfWork.run(async () => {
      const user = await this.usersRepository.findById(command.userId);

      if (!user) {
        throw new UserByIdNotFoundException(command.userId);
      }

      const previousRoleIds = user.getRoleIds();

      user.removeRole(command.roleId);

      await this.usersRepository.update(user);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'remove_role',
            entityType: EntityType.USERS,
            entityId: user.getId(),
            before: { roleIds: previousRoleIds },
            after: { roleIds: user.getRoleIds() },
            metadata: { roleId: command.roleId },
          }),
        ),
      );

      return { id: user.getId(), roleIds: user.getRoleIds() };
    });
  }
}
