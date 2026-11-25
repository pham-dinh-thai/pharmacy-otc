import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeNotFoundException } from '../../../domain/exceptions/employee.exceptions';
import { UpdateEmployeeCommand } from './update-employee.command';
import { UpdateEmployeeResponse } from './update-employee.response';
import {
  EMPLOYEES_REPOSITORY,
  type IEmployeesRepository,
} from '../../../domain/employees.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { AssignableDepartmentValidator } from '../../services/assignable-department.validator';
import { EmployeeStatusTransitionService } from '../../services/employee-status-transition.service';

@CommandHandler(UpdateEmployeeCommand)
export class UpdateEmployeeHandler implements ICommandHandler<UpdateEmployeeCommand> {
  public constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly departmentValidator: AssignableDepartmentValidator,
    private readonly statusTransition: EmployeeStatusTransitionService,
    private readonly commandBus: CommandBus,
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
        await this.commandBus.execute(
          new RecordAuditLogCommand(
            recordAuditProps(command.headers, {
              action: 'update',
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
          ),
        );
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
