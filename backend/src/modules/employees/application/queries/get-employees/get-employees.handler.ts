import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EMPLOYEES_REPOSITORY,
  type IEmployeesRepository,
} from '../../../domain/employees.repository';
import { EmployeeReadModel } from '../employee.read-model';
import { EmployeeReadModelFactory } from '../employee-read-model.factory';
import { GetEmployeesQuery } from './get-employees.query';

@QueryHandler(GetEmployeesQuery)
export class GetEmployeesHandler implements IQueryHandler<
  GetEmployeesQuery,
  EmployeeReadModel[]
> {
  public constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,

    private readonly readModelFactory: EmployeeReadModelFactory,
  ) {}

  public async execute(): Promise<EmployeeReadModel[]> {
    const employees = await this.employeesRepository.findAll();

    return Promise.all(
      employees.map((employee) => this.readModelFactory.create(employee)),
    );
  }
}
