import { Query } from '@nestjs/cqrs';
import { ProductDetailReadModel } from './product-detail.read-model';

export class GetProductQuery extends Query<ProductDetailReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
