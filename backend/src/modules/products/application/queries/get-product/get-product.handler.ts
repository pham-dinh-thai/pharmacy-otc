import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  type IProductsRepository,
  PRODUCTS_REPOSITORY,
} from '../../../domain/products.repository';
import { ProductNotFoundException } from '../../../domain/exceptions/product.exceptions';
import { GetProductQuery } from './get-product.query';
import { ProductDetailReadModel } from './product-detail.read-model';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<
  GetProductQuery,
  ProductDetailReadModel
> {
  public constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
  ) {}

  public async execute(
    query: GetProductQuery,
  ): Promise<ProductDetailReadModel> {
    const product = await this.productsRepository.findByIdIncludingDeleted(
      query.id,
    );

    if (!product) throw new ProductNotFoundException(query.id);

    return new ProductDetailReadModel(
      product.getId(),
      product.getName(),
      product.getUnitPrice(),
      product.getSku(),
      product.getUnit(),
      product.getDescription(),
      product.getImageUrl(),
      product.getWarning(),
      [...product.getCategoryIds()],
      product.getCreatedAt(),
      product.getUpdatedAt(),
      product.getDeletedAt(),
    );
  }
}
