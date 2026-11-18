import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DepartmentNotFoundException } from '../../../domain/exceptions/department.exceptions';
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
import { DEPARTMENT_UPDATED_EVENT } from '../../../domain/events/department-updated.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { UpdateDepartmentCommand } from './update-department.command';
import { UpdateDepartmentResponse } from './update-department.response';

@CommandHandler(UpdateDepartmentCommand)
export class UpdateDepartmentHandler implements ICommandHandler<UpdateDepartmentCommand> {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(
    command: UpdateDepartmentCommand,
  ): Promise<UpdateDepartmentResponse> {
    return this.unitOfWork.run(async () => {
      const department = await this.departmentsRepository.findById(command.id);

      if (!department) {
        throw new DepartmentNotFoundException(command.id);
      }

      const previousName = department.getName();

      department.rename(command.name);

      const result = await this.departmentsRepository.update(department);

      await this.outboxRepository.create({
        eventType: DEPARTMENT_UPDATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.DEPARTMENTS,
          entityId: result.getId(),
          before: { name: previousName },
          after: { name: result.getName() },
        }),
      });

      return new UpdateDepartmentResponse(result.getId(), result.getName());
    });
  }
}
