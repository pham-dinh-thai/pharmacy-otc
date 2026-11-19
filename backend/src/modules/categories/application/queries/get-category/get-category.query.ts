import { Query } from '@nestjs/cqrs';
import { CategoryDetailReadModel } from './category-detail.read-model';

export class GetCategoryQuery extends Query<CategoryDetailReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
