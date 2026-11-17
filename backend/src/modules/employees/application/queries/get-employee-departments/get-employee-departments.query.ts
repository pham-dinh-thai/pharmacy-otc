import { Query } from '@nestjs/cqrs';
import { EmployeeDepartmentOptionReadModel } from './employee-department-option.read-model';

export class GetEmployeeDepartmentsQuery extends Query<
  EmployeeDepartmentOptionReadModel[]
> {}
