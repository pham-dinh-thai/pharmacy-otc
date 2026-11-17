import { Query } from '@nestjs/cqrs';
import { DepartmentListItemReadModel } from './department-list-item.read-model';

export class GetDepartmentsQuery extends Query<DepartmentListItemReadModel[]> {}
