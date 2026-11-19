import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../../../domain/categories.repository';
import { GetCategoriesQuery } from './get-categories.query';
import { CategoryListItemReadModel } from './category-list-item.read-model';
import { CategoryListPageReadModel } from './category-list-page.read-model';

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler implements IQueryHandler<
  GetCategoriesQuery,
  CategoryListPageReadModel
> {
  public constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,
  ) {}

  public async execute(
    query: GetCategoriesQuery,
  ): Promise<CategoryListPageReadModel> {
    const { page, limit } = query;
    const result = await this.categoriesRepository.findPage({
      search: query.search,
      deleted: query.deleted,
      limit,
      offset: (page - 1) * limit,
    });

    return new CategoryListPageReadModel(
      result.items.map(
        (category) =>
          new CategoryListItemReadModel(
            category.getId(),
            category.getName(),
            category.getSlug(),
            category.getDescription(),
            category.getCreatedAt(),
            category.getUpdatedAt(),
            category.getDeletedAt(),
          ),
      ),
      result.total,
      page,
      limit,
    );
  }
}
