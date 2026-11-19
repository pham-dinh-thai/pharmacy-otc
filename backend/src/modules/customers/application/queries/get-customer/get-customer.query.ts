import { Query } from '@nestjs/cqrs';
import { CustomerDetailReadModel } from '../customer-detail.read-model';

export class GetCustomerQuery extends Query<CustomerDetailReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
