import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EMPLOYEES_REPOSITORY,
  type IEmployeesRepository,
} from '../../../domain/employees.repository';
import { EmployeeReadModel } from '../employee.read-model';
import { EmployeeReadModelFactory } from '../employee-read-model.factory';
import { GetEmployeeQuery } from './get-employee.query';

@QueryHandler(GetEmployeeQuery)
export class GetEmployeeHandler implements IQueryHandler<
  GetEmployeeQuery,
  EmployeeReadModel
> {
  public constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,

    private readonly readModelFactory: EmployeeReadModelFactory,
  ) {}

  public async execute(query: GetEmployeeQuery): Promise<EmployeeReadModel> {
    const employee = await this.employeesRepository.findById(query.id);

    if (!employee) {
      throw new NotFoundException(`Employee id ${query.id} not found`);
    }

    return this.readModelFactory.create(employee);
  }
}
