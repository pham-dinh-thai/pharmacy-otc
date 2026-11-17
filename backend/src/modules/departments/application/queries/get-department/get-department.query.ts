import { Query } from '@nestjs/cqrs';
import { DepartmentListItemReadModel } from '../get-departments/department-list-item.read-model';

export class GetDepartmentQuery extends Query<DepartmentListItemReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
