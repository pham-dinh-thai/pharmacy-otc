import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  type IProductsRepository,
  PRODUCTS_REPOSITORY,
} from '../../../domain/products.repository';
import { GetProductsQuery } from './get-products.query';
import { ProductListItemReadModel } from './product-list-item.read-model';
import { ProductListPageReadModel } from './product-list-page.read-model';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<
  GetProductsQuery,
  ProductListPageReadModel
> {
  public constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
  ) {}

  public async execute(
    query: GetProductsQuery,
  ): Promise<ProductListPageReadModel> {
    const { page, limit } = query;
    const result = await this.productsRepository.findPage({
      search: query.search,
      deleted: query.deleted,
      categoryId: query.categoryId,
      inStock: query.inStock,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      limit,
      offset: (page - 1) * limit,
    });

    return new ProductListPageReadModel(
      result.items.map(
        (product) =>
          new ProductListItemReadModel(
            product.getId(),
            product.getName(),
            product.getUnitPrice(),
            product.getQuantity(),
            [...product.getCategoryIds()],
            product.getCreatedAt(),
            product.getUpdatedAt(),
            product.getDeletedAt(),
          ),
      ),
      result.total,
      page,
      limit,
    );
  }
}
