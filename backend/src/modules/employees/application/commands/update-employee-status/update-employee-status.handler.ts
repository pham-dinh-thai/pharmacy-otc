import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  EMPLOYEES_REPOSITORY,
  type IEmployeesRepository,
} from '../../../domain/employees.repository';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { UpdateEmployeeStatusCommand } from './update-employee-status.command';
import { EmployeeStatusTransitionService } from '../../services/employee-status-transition.service';

@CommandHandler(UpdateEmployeeStatusCommand)
export class UpdateEmployeeStatusHandler implements ICommandHandler<UpdateEmployeeStatusCommand> {
  public constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly statusTransition: EmployeeStatusTransitionService,
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

      const statusChanged = await this.statusTransition.apply(
        employee,
        command.status,
        command.headers,
      );

      if (statusChanged) {
        await this.employeesRepository.update(employee);
      }

      return { id: employee.getId(), status: employee.getStatus() };
    });
  }
}
