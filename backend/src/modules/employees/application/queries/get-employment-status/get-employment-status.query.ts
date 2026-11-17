import { Query } from '@nestjs/cqrs';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';

export class GetEmploymentStatusQuery extends Query<EmployeeStatus | null> {
  public constructor(public readonly userId: string) {
    super();
  }
}
