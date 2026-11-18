import { Query } from '@nestjs/cqrs';
import { SupplierDetailReadModel } from './supplier-detail.read-model';

export class GetSupplierQuery extends Query<SupplierDetailReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
