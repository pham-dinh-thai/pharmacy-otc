import { Injectable } from '@nestjs/common';
import { type FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  type FindProductsFilters,
  IProductsRepository,
  type ProductPage,
} from '../../domain/products.repository';
import { Product } from '../../domain/product.aggregate';
import { likePattern } from '../../../../shared/utils/list-filters';
import { MikroProduct } from '../entities/mikro-product.entity';
import { MikroProductCategory } from '../../../categories/infrastructure/entities/mikro-product-category.entity';
import { MikroInventory } from '../../../inventories/infrastructure/entities/mikro-inventory.entity';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class MikroProductsRepository implements IProductsRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(filters?: FindProductsFilters): Promise<ProductPage> {
    const deleted = filters?.deleted ?? false;
    const pattern = likePattern(filters?.search);

    const inStockProductIds =
      filters?.inStock !== undefined
        ? await this.findProductIdsWithPositiveStock()
        : undefined;

    if (filters?.inStock === true && inStockProductIds?.length === 0) {
      return { items: [], total: 0 };
    }

    const where: FilterQuery<MikroProduct> = {
      ...(deleted === true
        ? { deletedAt: { $ne: null } }
        : deleted === false
          ? { deletedAt: null }
          : {}),
      ...(pattern ? { name: { $ilike: pattern } } : {}),
      ...(filters?.minPrice !== undefined || filters?.maxPrice !== undefined
        ? {
            unitPrice: {
              ...(filters.minPrice !== undefined
                ? { $gte: BigInt(filters.minPrice) }
                : {}),
              ...(filters.maxPrice !== undefined
                ? { $lte: BigInt(filters.maxPrice) }
                : {}),
            },
          }
        : {}),
    };

    if (filters?.categoryId) {
      let linkedProductIds = await this.findProductIdsByCategory(
        filters.categoryId,
      );

      if (inStockProductIds) {
        linkedProductIds = linkedProductIds.filter((id) =>
          filters.inStock
            ? inStockProductIds.includes(id)
            : !inStockProductIds.includes(id),
        );
      }

      if (linkedProductIds.length === 0) return { items: [], total: 0 };
      where.id = { $in: linkedProductIds };
    } else if (filters?.inStock === true && inStockProductIds) {
      where.id = { $in: inStockProductIds };
    } else if (filters?.inStock === false && inStockProductIds?.length) {
      // Sản phẩm không có bản g inventories cũng được coi là hết hàng.
      where.id = { $nin: inStockProductIds };
    }

    const [mikroProducts, total] = await this.entityManager.findAndCount(
      MikroProduct,
      where,
      {
        orderBy: { createdAt: 'desc' },
        ...(filters?.limit !== undefined ? { limit: filters.limit } : {}),
        ...(filters?.offset !== undefined ? { offset: filters.offset } : {}),
      },
    );

    const items = await Promise.all(
      mikroProducts.map(async (mikroProduct) =>
        ProductMapper.toDomain(
          mikroProduct,
          await this.findCategoryIds(mikroProduct.id),
        ),
      ),
    );

    return { items, total };
  }

  public async findById(id: string): Promise<Product | null> {
    return this.findByIdWithCondition(id, true);
  }

  public async findByIdIncludingDeleted(id: string): Promise<Product | null> {
    return this.findByIdWithCondition(id, false);
  }

  public async findCategoryIds(productId: string): Promise<string[]> {
    const rows = await this.entityManager.find(
      MikroProductCategory,
      { productId },
      { fields: ['categoryId'] },
    );

    return rows.map((row) => row.categoryId);
  }

  public async findStockQuantities(
    productIds: string[],
  ): Promise<Map<string, number>> {
    if (productIds.length === 0) return new Map();

    const rows = await this.entityManager.find(
      MikroInventory,
      { productId: { $in: productIds } },
      { fields: ['productId', 'totalQuantity'] },
    );

    return new Map(rows.map((row) => [row.productId, row.totalQuantity]));
  }

  public async existsById(id: string): Promise<boolean> {
    const mikroProduct = await this.entityManager.findOne(MikroProduct, { id });

    return mikroProduct !== null;
  }

  public async existsBySku(sku: string, excludeId?: string): Promise<boolean> {
    const found = await this.entityManager.findOne(
      MikroProduct,
      {
        sku,
        ...(excludeId ? { id: { $ne: excludeId } } : {}),
      },
      { fields: ['id'] },
    );

    return found !== null;
  }

  public async create(product: Product): Promise<void> {
    await this.persistProduct(new MikroProduct(), product, true);
  }

  public async update(product: Product): Promise<void> {
    const mikroProduct = this.entityManager.getReference(
      MikroProduct,
      product.getId(),
    );

    await this.persistProduct(mikroProduct, product, false);
  }

  private async findByIdWithCondition(
    id: string,
    onlyActive: boolean,
  ): Promise<Product | null> {
    const mikroProduct = await this.entityManager.findOne(MikroProduct, {
      id,
      ...(onlyActive ? { deletedAt: null } : {}),
    });

    if (!mikroProduct) return null;

    return ProductMapper.toDomain(
      mikroProduct,
      await this.findCategoryIds(mikroProduct.id),
    );
  }

  private async findProductIdsWithPositiveStock(): Promise<string[]> {
    const rows = await this.entityManager.find(
      MikroInventory,
      { totalQuantity: { $gt: 0 } },
      { fields: ['productId'] },
    );

    return rows.map((row) => row.productId);
  }

  private async findProductIdsByCategory(
    categoryId: string,
  ): Promise<string[]> {
    const rows = await this.entityManager.find(
      MikroProductCategory,
      { categoryId },
      { fields: ['productId'] },
    );

    return rows.map((row) => row.productId);
  }

  private async persistProduct(
    mikroProduct: MikroProduct,
    product: Product,
    insert: boolean,
  ): Promise<void> {
    ProductMapper.assign(mikroProduct, product);

    if (insert) {
      this.entityManager.persist(mikroProduct);
    }

    await this.entityManager.flush();
    await this.syncCategoryIds(product);
  }

  /** Thay thế toàn bộ liên kết danh mục của sản phẩm. */
  private async syncCategoryIds(product: Product): Promise<void> {
    const productId = product.getId();
    const categoryIds = product.getCategoryIds();

    await this.entityManager.nativeDelete(MikroProductCategory, { productId });

    if (categoryIds.length > 0) {
      const links = categoryIds.map((categoryId) => {
        const link = new MikroProductCategory();
        link.productId = productId;
        link.categoryId = categoryId;

        return link;
      });

      await this.entityManager.insertMany(MikroProductCategory, links);
    }
  }
}
