import { describe, expect, it, jest } from '@jest/globals';
import { QueryBus } from '@nestjs/cqrs';
import { CategoryListPageReadModel } from '../../categories/application/queries/get-categories/category-list-page.read-model';
import { CategoryListItemReadModel } from '../../categories/application/queries/get-categories/category-list-item.read-model';
import { GetCategoriesQuery } from '../../categories/application/queries/get-categories/get-categories.query';
import { GetProductQuery } from '../../products/application/queries/get-product/get-product.query';
import { ProductDetailReadModel } from '../../products/application/queries/get-product/product-detail.read-model';
import { GetProductsQuery } from '../../products/application/queries/get-products/get-products.query';
import { ProductListItemReadModel } from '../../products/application/queries/get-products/product-list-item.read-model';
import { ProductListPageReadModel } from '../../products/application/queries/get-products/product-list-page.read-model';
import { StorefrontService } from './storefront.service';

const CATEGORY_ID = '8b216824-b261-4481-bd4f-304def8b5b2d';
const OTHER_CATEGORY_ID = 'a6a0dc2f-3e55-4a1c-9d1a-6d2e8b4a4f21';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';

const category = () =>
  new CategoryListItemReadModel(
    CATEGORY_ID,
    'Thuốc cảm cúm',
    'thuoc-cam-cum',
    null,
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
    null,
  );

const product = (stockQuantity: number) =>
  new ProductListItemReadModel(
    PRODUCT_ID,
    'Sản phẩm A',
    '25000',
    stockQuantity,
    'SP-A',
    'hộp',
    'Mô tả',
    '/api/uploads/images/a.png',
    'Cảnh báo',
    [CATEGORY_ID, 'unknown-category'],
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
    null,
  );

const detail = (deletedAt: Date | null = null) =>
  new ProductDetailReadModel(
    PRODUCT_ID,
    'Sản phẩm A',
    '25000',
    'SP-A',
    'hộp',
    'Mô tả',
    '/api/uploads/images/a.png',
    'Cảnh báo',
    [CATEGORY_ID],
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
    deletedAt,
  );

const setup = (
  execute: (query: unknown) => Promise<unknown>,
  stock = new Map<string, number>([[PRODUCT_ID, 12]]),
) => {
  const queryBusExecute = jest.fn(execute);
  const queryBus = { execute: queryBusExecute } as unknown as QueryBus;
  const productsRepository = {
    findStockQuantities: jest
      .fn<() => Promise<Map<string, number>>>()
      .mockResolvedValue(stock),
  };
  const service = new StorefrontService(queryBus, productsRepository as never);

  return { service, queryBus, queryBusExecute, productsRepository };
};

const executeFor = ({
  categories = [category()],
  items = [product(12)],
  detailValue = detail(),
}: {
  categories?: CategoryListItemReadModel[];
  items?: ProductListItemReadModel[];
  detailValue?: ProductDetailReadModel;
} = {}) => {
  return ((query: unknown) => {
    if (query instanceof GetCategoriesQuery) {
      return Promise.resolve(
        new CategoryListPageReadModel(categories, categories.length, 1, 100),
      );
    }
    if (query instanceof GetProductsQuery) {
      return Promise.resolve(
        new ProductListPageReadModel(items, items.length, 1, 20),
      );
    }
    if (query instanceof GetProductQuery) {
      return Promise.resolve(detailValue);
    }

    throw new Error(`Unexpected query: ${String(query)}`);
  }) as (query: unknown) => Promise<unknown>;
};

describe('StorefrontService', () => {
  it('returns active categories only', async () => {
    const { service, queryBusExecute } = setup(executeFor());

    await expect(service.listCategories()).resolves.toEqual([
      {
        id: CATEGORY_ID,
        name: 'Thuốc cảm cúm',
        slug: 'thuoc-cam-cum',
        description: null,
        productCount: 1,
      },
    ]);
    expect(queryBusExecute).toHaveBeenCalledWith(
      expect.objectContaining({ deleted: false }),
    );
  });

  it('lists non-deleted products with stock and category names', async () => {
    const { service, queryBusExecute } = setup(executeFor());

    const result = await service.listProducts({
      search: 'cảm',
      categoryId: CATEGORY_ID,
      page: 1,
      limit: 20,
    });

    expect(queryBusExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'cảm',
        deleted: false,
        categoryId: CATEGORY_ID,
      }),
    );
    expect(result).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      items: [
        {
          id: PRODUCT_ID,
          name: 'Sản phẩm A',
          sku: 'SP-A',
          unit: 'hộp',
          unitPrice: '25000',
          imageUrl: '/api/uploads/images/a.png',
          description: 'Mô tả',
          warning: 'Cảnh báo',
          stockQuantity: 12,
          inStock: true,
          categories: [
            { id: CATEGORY_ID, name: 'Thuốc cảm cúm', slug: 'thuoc-cam-cum' },
          ],
        },
      ],
    });
  });

  it('marks out-of-stock products', async () => {
    const { service } = setup(executeFor({ items: [product(0)] }));

    const result = await service.listProducts({ page: 1, limit: 20 });

    expect(result.items[0]).toMatchObject({
      stockQuantity: 0,
      inStock: false,
    });
  });

  it('returns product detail with live stock', async () => {
    const { service } = setup(executeFor());

    await expect(service.getProduct(PRODUCT_ID)).resolves.toMatchObject({
      id: PRODUCT_ID,
      stockQuantity: 12,
      inStock: true,
      categories: [{ id: CATEGORY_ID }],
    });
  });

  it('hides deleted products from the storefront', async () => {
    const deleted = new Date('2026-02-01T00:00:00.000Z');
    const { service } = setup(executeFor({ detailValue: detail(deleted) }));

    await expect(service.getProduct(PRODUCT_ID)).resolves.toBeNull();
  });

  it('does not use category ids that no longer exist', async () => {
    const { service } = setup(
      executeFor({
        categories: [
          new CategoryListItemReadModel(
            OTHER_CATEGORY_ID,
            'Khác',
            'khac',
            null,
            new Date(),
            new Date(),
            null,
          ),
        ],
      }),
    );

    const result = await service.listProducts({ page: 1, limit: 20 });

    expect(result.items[0].categories).toEqual([]);
  });
});
