import { RoleListItemReadModel } from './role-list-item.read-model';

export class RolePageReadModel {
  public constructor(
    public readonly items: RoleListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
