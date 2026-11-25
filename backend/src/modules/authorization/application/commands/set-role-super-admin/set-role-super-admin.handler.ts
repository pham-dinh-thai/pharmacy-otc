import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RoleNotFoundException } from '../../../domain/exceptions/role.exceptions';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../domain/roles.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { SetRoleSuperAdminCommand } from './set-role-super-admin.command';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(SetRoleSuperAdminCommand)
export class SetRoleSuperAdminHandler implements ICommandHandler<SetRoleSuperAdminCommand> {
  public constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: SetRoleSuperAdminCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const role = await this.rolesRepository.findById(command.id);

      if (!role) {
        throw new RoleNotFoundException(command.id);
      }

      const previousIsSuperAdmin = role.getIsSuperAdmin();

      if (command.isSuperAdmin) {
        role.promoteToSuperAdmin();
      } else {
        role.demoteFromSuperAdmin();
      }

      await this.rolesRepository.update(role);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'set_super_admin',
            entityType: EntityType.ROLES,
            entityId: role.getId(),
            before: { isSuperAdmin: previousIsSuperAdmin },
            after: { isSuperAdmin: role.getIsSuperAdmin() },
          }),
        ),
      );

      return { id: role.getId() };
    });
  }
}
