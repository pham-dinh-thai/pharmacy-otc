import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../domain/departments.repository';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { DEPARTMENT_DISABLED_EVENT } from '../../../domain/events/department-disabled.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { SoftDeleteDepartmentCommand } from './soft-delete-department.command';

@CommandHandler(SoftDeleteDepartmentCommand)
export class SoftDeleteDepartmentHandler implements ICommandHandler<SoftDeleteDepartmentCommand> {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(
    command: SoftDeleteDepartmentCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const department = await this.departmentsRepository.findById(command.id);

      if (!department) {
        throw new NotFoundException(`Department id ${command.id} not found`);
      }

      const previousName = department.getName();

      department.softDelete();

      await this.departmentsRepository.update(department);

      await this.outboxRepository.create({
        eventType: DEPARTMENT_DISABLED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.DEPARTMENTS,
          entityId: department.getId(),
          before: { name: previousName, deletedAt: null },
          after: {
            name: department.getName(),
            deletedAt: department.getDeletedAt(),
          },
        }),
      });

      return { id: department.getId() };
    });
  }
}
