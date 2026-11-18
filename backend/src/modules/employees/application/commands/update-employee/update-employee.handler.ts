import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeNotFoundException } from '../../../domain/exceptions/employee.exceptions';
import { UpdateEmployeeCommand } from './update-employee.command';
import { UpdateEmployeeResponse } from './update-employee.response';
import {
  EMPLOYEES_REPOSITORY,
  type IEmployeesRepository,
} from '../../../domain/employees.repository';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { EMPLOYEE_UPDATED_EVENT } from '../../../domain/events/employee-updated.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { AssignableDepartmentValidator } from '../../services/assignable-department.validator';
import { EmployeeStatusTransitionService } from '../../services/employee-status-transition.service';

@CommandHandler(UpdateEmployeeCommand)
export class UpdateEmployeeHandler implements ICommandHandler<UpdateEmployeeCommand> {
  public constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly departmentValidator: AssignableDepartmentValidator,
    private readonly statusTransition: EmployeeStatusTransitionService,
  ) {}

  public execute(
    command: UpdateEmployeeCommand,
  ): Promise<UpdateEmployeeResponse> {
    return this.unitOfWork.run(async () => {
      const employee = await this.employeesRepository.findById(
        command.employeeId,
      );

      if (!employee) {
        throw new EmployeeNotFoundException(command.employeeId);
      }

      await this.departmentValidator.validate(command.departmentId);

      const previousDepartmentId = employee.getDepartmentId();
      const previousPosition = employee.getPosition();

      employee.changeAssignment(
        command.departmentId,
        command.position === undefined
          ? employee.getPosition()
          : command.position,
      );

      const assignmentChanged =
        employee.getDepartmentId() !== previousDepartmentId ||
        employee.getPosition() !== previousPosition;

      const statusChanged =
        command.status === undefined
          ? false
          : await this.statusTransition.apply(
              employee,
              command.status,
              command.headers,
            );

      if (!assignmentChanged && !statusChanged) {
        return new UpdateEmployeeResponse(
          employee.getId(),
          employee.getDepartmentId(),
          employee.getPosition(),
          employee.getStatus(),
        );
      }

      await this.employeesRepository.update(employee);

      if (assignmentChanged) {
        await this.outboxRepository.create({
          eventType: EMPLOYEE_UPDATED_EVENT,
          payload: auditEventPayload(command.headers, {
            entityType: EntityType.EMPLOYEES,
            entityId: employee.getId(),
            before: {
              departmentId: previousDepartmentId,
              position: previousPosition,
            },
            after: {
              departmentId: employee.getDepartmentId(),
              position: employee.getPosition(),
            },
          }),
        });
      }

      return new UpdateEmployeeResponse(
        employee.getId(),
        employee.getDepartmentId(),
        employee.getPosition(),
        employee.getStatus(),
      );
    });
  }
}
