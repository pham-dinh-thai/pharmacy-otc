import { Query } from '@nestjs/cqrs';
import { EmployeeReadModel } from '../employee.read-model';

export class GetEmployeesQuery extends Query<EmployeeReadModel[]> {}
