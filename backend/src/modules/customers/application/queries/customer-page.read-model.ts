import { CustomerListItemReadModel } from './customer-list-item.read-model';

export class CustomerPageReadModel {
  public constructor(
    public readonly items: CustomerListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
