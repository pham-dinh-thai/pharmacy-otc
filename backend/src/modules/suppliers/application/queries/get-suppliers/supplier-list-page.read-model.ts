import { SupplierListItemReadModel } from './supplier-list-item.read-model';

export class SupplierListPageReadModel {
  public constructor(
    public readonly items: SupplierListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
