import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../../../domain/categories.repository';
import { CategoryNotFoundException } from '../../../domain/exceptions/category.exceptions';
import { GetCategoryQuery } from './get-category.query';
import { CategoryDetailReadModel } from './category-detail.read-model';

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<
  GetCategoryQuery,
  CategoryDetailReadModel
> {
  public constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,
  ) {}

  public async execute(
    query: GetCategoryQuery,
  ): Promise<CategoryDetailReadModel> {
    const category = await this.categoriesRepository.findByIdIncludingDeleted(
      query.id,
    );

    if (!category) throw new CategoryNotFoundException(query.id);

    return new CategoryDetailReadModel(
      category.getId(),
      category.getName(),
      category.getSlug(),
      category.getDescription(),
      [...category.getProductIds()],
      category.getCreatedAt(),
      category.getUpdatedAt(),
      category.getDeletedAt(),
    );
  }
}
