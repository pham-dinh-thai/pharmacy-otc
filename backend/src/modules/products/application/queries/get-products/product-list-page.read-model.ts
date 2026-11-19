import { ProductListItemReadModel } from './product-list-item.read-model';

export class ProductListPageReadModel {
  public constructor(
    public readonly items: ProductListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
