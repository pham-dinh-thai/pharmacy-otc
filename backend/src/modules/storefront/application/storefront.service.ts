import { Inject, Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCategoriesQuery } from '../../categories/application/queries/get-categories/get-categories.query';
import { GetProductQuery } from '../../products/application/queries/get-product/get-product.query';
import { GetProductsQuery } from '../../products/application/queries/get-products/get-products.query';
import {
  PRODUCTS_REPOSITORY,
  type IProductsRepository,
} from '../../products/domain/products.repository';
import type {
  StorefrontCategory,
  StorefrontProduct,
  StorefrontProductPage,
} from './storefront.read-model';

export type ListStorefrontProducts = {
  search?: string;
  categoryId?: string;
  page: number;
  limit: number;
};

@Injectable()
export class StorefrontService {
  public constructor(
    private readonly queryBus: QueryBus,
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
  ) {}

  public async listCategories(): Promise<StorefrontCategory[]> {
    const page = await this.queryBus.execute(
      new GetCategoriesQuery(undefined, false, 1, 100),
    );

    return Promise.all(
      page.items.map(async (category) => {
        const products = await this.queryBus.execute(
          new GetProductsQuery(
            undefined,
            false,
            category.id,
            undefined,
            undefined,
            undefined,
            1,
            1,
          ),
        );

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          productCount: products.total,
        };
      }),
    );
  }

  public async listProducts(
    filters: ListStorefrontProducts,
  ): Promise<StorefrontProductPage> {
    const [page, categories] = await Promise.all([
      this.queryBus.execute(
        new GetProductsQuery(
          filters.search,
          false,
          filters.categoryId,
          undefined,
          undefined,
          undefined,
          filters.page,
          filters.limit,
        ),
      ),
      this.listCategories(),
    ]);

    return {
      items: page.items.map((product) =>
        this.toProduct(
          {
            id: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            unitPrice: product.unitPrice,
            imageUrl: product.imageUrl,
            description: product.description,
            warning: product.warning,
            stockQuantity: product.stockQuantity,
            categoryIds: product.categoryIds,
          },
          categories,
        ),
      ),
      total: page.total,
      page: page.page,
      limit: page.limit,
    };
  }

  public async getProduct(id: string): Promise<StorefrontProduct | null> {
    const [detail, stock, categories] = await Promise.all([
      this.queryBus.execute(new GetProductQuery(id)),
      this.productsRepository.findStockQuantities([id]),
      this.listCategories(),
    ]);

    if (detail.deletedAt) {
      return null;
    }

    return this.toProduct(
      {
        id: detail.id,
        name: detail.name,
        sku: detail.sku,
        unit: detail.unit,
        unitPrice: detail.unitPrice,
        imageUrl: detail.imageUrl,
        description: detail.description,
        warning: detail.warning,
        stockQuantity: stock.get(id) ?? 0,
        categoryIds: detail.categoryIds,
      },
      categories,
    );
  }

  private toProduct(
    product: Omit<StorefrontProduct, 'inStock' | 'categories'> & {
      categoryIds: string[];
    },
    categories: StorefrontCategory[],
  ): StorefrontProduct {
    const { categoryIds, ...rest } = product;

    return {
      ...rest,
      inStock: rest.stockQuantity > 0,
      categories: categories
        .filter((category) => categoryIds.includes(category.id))
        .map(({ id, name, slug }) => ({ id, name, slug })),
    };
  }
}
