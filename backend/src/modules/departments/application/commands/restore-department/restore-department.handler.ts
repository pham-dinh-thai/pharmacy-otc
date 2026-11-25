import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DepartmentNotFoundException } from '../../../domain/exceptions/department.exceptions';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../domain/departments.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { RestoreDepartmentCommand } from './restore-department.command';

@CommandHandler(RestoreDepartmentCommand)
export class RestoreDepartmentHandler implements ICommandHandler<RestoreDepartmentCommand> {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: RestoreDepartmentCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const department = await this.departmentsRepository.findById(command.id);

      if (!department) {
        throw new DepartmentNotFoundException(command.id);
      }

      const previousName = department.getName();
      const previousDeletedAt = department.getDeletedAt();

      department.restore();

      await this.departmentsRepository.update(department);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'activate',
            entityType: EntityType.DEPARTMENTS,
            entityId: department.getId(),
            before: { name: previousName, deletedAt: previousDeletedAt },
            after: { name: department.getName(), deletedAt: null },
          }),
        ),
      );

      return { id: department.getId() };
    });
  }
}
