import { DepartmentListItemReadModel } from './department-list-item.read-model';

export class DepartmentPageReadModel {
  public constructor(
    public readonly items: DepartmentListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
