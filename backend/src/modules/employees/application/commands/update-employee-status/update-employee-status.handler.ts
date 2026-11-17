import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  EMPLOYEES_REPOSITORY,
  type IEmployeesRepository,
} from '../../../domain/employees.repository';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { EMPLOYEE_STATUS_CHANGED_EVENT } from '../../../domain/events/employee-status-changed.event';
import { EMPLOYEE_RESIGNED_EVENT } from '../../../domain/events/employee-resigned.event';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { UpdateEmployeeStatusCommand } from './update-employee-status.command';

@CommandHandler(UpdateEmployeeStatusCommand)
export class UpdateEmployeeStatusHandler implements ICommandHandler<UpdateEmployeeStatusCommand> {
  public constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: UpdateEmployeeStatusCommand): Promise<{
    id: string;
    status: EmployeeStatus;
  }> {
    return this.unitOfWork.run(async () => {
      const employee = await this.employeesRepository.findById(
        command.employeeId,
      );

      if (!employee) {
        throw new NotFoundException(
          `Employee id ${command.employeeId} not found`,
        );
      }

      const previousStatus = employee.getStatus();

      if (previousStatus === command.status) {
        return { id: employee.getId(), status: previousStatus };
      }

      employee.changeStatus(command.status);

      await this.employeesRepository.update(employee);

      await this.outboxRepository.create({
        eventType: EMPLOYEE_STATUS_CHANGED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.EMPLOYEES,
          entityId: employee.getId(),
          before: { status: previousStatus },
          after: { status: employee.getStatus() },
        }),
      });

      if (command.status === EmployeeStatus.RESIGNED) {
        await this.outboxRepository.create({
          eventType: EMPLOYEE_RESIGNED_EVENT,
          payload: {
            employeeId: employee.getId(),
            userId: employee.getUserId(),
            headers: command.headers,
          },
        });
      }

      return { id: employee.getId(), status: employee.getStatus() };
    });
  }
}
