import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { EMPLOYEES_REPOSITORY } from '../../../domain/employees.repository';
import type { IEmployeesRepository } from '../../../domain/employees.repository';
import type { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { GetEmploymentStatusQuery } from './get-employment-status.query';

@QueryHandler(GetEmploymentStatusQuery)
export class GetEmploymentStatusHandler implements IQueryHandler<GetEmploymentStatusQuery> {
  public constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,
  ) {}

  public async execute(
    query: GetEmploymentStatusQuery,
  ): Promise<EmployeeStatus | null> {
    return this.employeesRepository.findStatusByUserId(query.userId);
  }
}
