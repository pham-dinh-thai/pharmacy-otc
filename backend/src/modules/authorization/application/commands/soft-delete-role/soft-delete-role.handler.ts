import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
import { SoftDeleteRoleCommand } from './soft-delete-role.command';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { ROLE_DISABLED_EVENT } from '../../../domain/events/role-disabled.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(SoftDeleteRoleCommand)
export class SoftDeleteRoleHandler implements ICommandHandler<SoftDeleteRoleCommand> {
  public constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: SoftDeleteRoleCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const role = await this.rolesRepository.findById(command.id);

      if (!role) {
        throw new RoleNotFoundException(command.id);
      }

      const previousName = role.getName();
      const previousIsSuperAdmin = role.getIsSuperAdmin();

      role.softDelete();

      await this.rolesRepository.update(role);

      await this.outboxRepository.create({
        eventType: ROLE_DISABLED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.ROLES,
          entityId: role.getId(),
          before: {
            name: previousName,
            isSuperAdmin: previousIsSuperAdmin,
            deletedAt: null,
          },
          after: {
            name: role.getName(),
            isSuperAdmin: role.getIsSuperAdmin(),
            deletedAt: role.getDeletedAt(),
          },
        }),
      });

      return { id: role.getId() };
    });
  }
}
