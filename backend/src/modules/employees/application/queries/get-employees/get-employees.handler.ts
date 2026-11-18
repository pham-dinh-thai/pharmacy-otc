import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  EMPLOYEES_REPOSITORY,
  type IEmployeesRepository,
} from '../../../domain/employees.repository';
import { EmployeeReadModelFactory } from '../employee-read-model.factory';
import { EmployeePageReadModel } from './employee-page.read-model';
import { GetEmployeesQuery } from './get-employees.query';

@QueryHandler(GetEmployeesQuery)
export class GetEmployeesHandler implements IQueryHandler<
  GetEmployeesQuery,
  EmployeePageReadModel
> {
  public constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,

    private readonly readModelFactory: EmployeeReadModelFactory,
  ) {}

  public async execute(
    query: GetEmployeesQuery,
  ): Promise<EmployeePageReadModel> {
    const { page, limit } = query;
    const result = await this.employeesRepository.findPage({
      limit,
      offset: (page - 1) * limit,
    });

    return new EmployeePageReadModel(
      await Promise.all(
        result.items.map((employee) => this.readModelFactory.create(employee)),
      ),
      result.total,
      page,
      limit,
    );
  }
}
