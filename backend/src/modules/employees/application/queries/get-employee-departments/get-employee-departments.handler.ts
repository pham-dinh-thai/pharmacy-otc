import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../../departments/domain/departments.repository';
import { EmployeeDepartmentOptionReadModel } from './employee-department-option.read-model';
import { GetEmployeeDepartmentsQuery } from './get-employee-departments.query';

@QueryHandler(GetEmployeeDepartmentsQuery)
export class GetEmployeeDepartmentsHandler implements IQueryHandler<
  GetEmployeeDepartmentsQuery,
  EmployeeDepartmentOptionReadModel[]
> {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  public async execute(): Promise<EmployeeDepartmentOptionReadModel[]> {
    const departments = await this.departmentsRepository.findActive();

    return departments.map(
      (department) =>
        new EmployeeDepartmentOptionReadModel(
          department.getId(),
          department.getName(),
        ),
    );
  }
}
