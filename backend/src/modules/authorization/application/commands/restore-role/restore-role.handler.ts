import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../domain/roles.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RestoreRoleCommand } from './restore-role.command';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { ROLE_RESTORED_EVENT } from '../../../domain/events/role-restored.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(RestoreRoleCommand)
export class RestoreRoleHandler implements ICommandHandler<RestoreRoleCommand> {
  public constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(command: RestoreRoleCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const role = await this.rolesRepository.findById(command.id);

      if (!role) {
        throw new NotFoundException(`Role id ${command.id} not found`);
      }

      const previousDeletedAt = role.getDeletedAt();

      role.restore();

      await this.rolesRepository.update(role);

      await this.outboxRepository.create({
        eventType: ROLE_RESTORED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.ROLES,
          entityId: role.getId(),
          before: { deletedAt: previousDeletedAt },
          after: { deletedAt: role.getDeletedAt() },
        }),
      });

      return { id: role.getId() };
    });
  }
}
