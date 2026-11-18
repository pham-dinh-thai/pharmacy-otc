import { Query } from '@nestjs/cqrs';
import { SupplierListItemReadModel } from './supplier-list-item.read-model';

export class GetSuppliersQuery extends Query<SupplierListItemReadModel[]> {
  public constructor(
    public readonly deleted?: boolean,
    public readonly search?: string,
  ) {
    super();
  }
}
