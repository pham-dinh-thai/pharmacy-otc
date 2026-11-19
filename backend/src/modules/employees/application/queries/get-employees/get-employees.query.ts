import { Query } from '@nestjs/cqrs';
import { EmployeePosition } from '../../../domain/enums/employee-position.enum';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { EmployeePageReadModel } from './employee-page.read-model';

export type GetEmployeesFilters = {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  position?: EmployeePosition;
  status?: EmployeeStatus;
};

export class GetEmployeesQuery extends Query<EmployeePageReadModel> {
  public readonly page: number;
  public readonly limit: number;
  public readonly search: string | undefined;
  public readonly departmentId: string | undefined;
  public readonly position: EmployeePosition | undefined;
  public readonly status: EmployeeStatus | undefined;

  public constructor(filters: GetEmployeesFilters = {}) {
    super();

    this.page = Math.max(1, filters.page ?? 1);
    this.limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    this.search = filters.search?.trim() || undefined;
    this.departmentId = filters.departmentId || undefined;
    this.position = filters.position;
    this.status = filters.status;
  }
}
