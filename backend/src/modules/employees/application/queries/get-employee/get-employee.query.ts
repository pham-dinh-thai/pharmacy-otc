import { Query } from '@nestjs/cqrs';
import { EmployeeReadModel } from '../employee.read-model';

export class GetEmployeeQuery extends Query<EmployeeReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
