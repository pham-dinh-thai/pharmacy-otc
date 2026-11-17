import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../domain/departments.repository';
import { Department } from '../../../domain/department.aggregate';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { DEPARTMENT_CREATED_EVENT } from '../../../domain/events/department-created.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateDepartmentCommand } from './create-department.command';

@CommandHandler(CreateDepartmentCommand)
export class CreateDepartmentHandler implements ICommandHandler<CreateDepartmentCommand> {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: CreateDepartmentCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const department = Department.create({ name: command.name });

      await this.departmentsRepository.create(department);

      await this.outboxRepository.create({
        eventType: DEPARTMENT_CREATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.DEPARTMENTS,
          entityId: department.getId(),
          after: { name: department.getName() },
        }),
      });

      return { id: department.getId() };
    });
  }
}
