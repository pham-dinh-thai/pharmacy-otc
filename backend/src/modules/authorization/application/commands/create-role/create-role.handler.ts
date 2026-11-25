import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../domain/roles.repository';
import { Role } from '../../../domain/role.aggregate';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateRoleCommand } from './create-role.command';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  public constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly commandBus: CommandBus,
  ) {}

  public execute(command: CreateRoleCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const role = Role.create({
        name: command.name,
        permissions: command.permissions,
        isSuperAdmin: command.isSuperAdmin,
      });

      await this.rolesRepository.create(role);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'create',
            entityType: EntityType.ROLES,
            entityId: role.getId(),
            after: {
              name: role.getName(),
              permissions: role.getPermissions(),
              isSuperAdmin: role.getIsSuperAdmin(),
            },
          }),
        ),
      );

      return { id: role.getId() };
    });
  }
}
