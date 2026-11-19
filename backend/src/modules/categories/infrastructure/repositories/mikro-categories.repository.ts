import { Injectable } from '@nestjs/common';
import {
  EntityManager,
  type FilterQuery,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import {
  type FindCategoriesFilters,
  ICategoriesRepository,
  type CategoryPage,
} from '../../domain/categories.repository';
import { Category } from '../../domain/category.aggregate';
import { CategoryAlreadyExistsException } from '../../domain/exceptions/category.exceptions';
import { likePattern } from '../../../../shared/utils/list-filters';
import { CategoryMapper } from '../mappers/category.mapper';
import { MikroCategory } from '../entities/mikro-category.entity';
import { MikroProductCategory } from '../entities/mikro-product-category.entity';

@Injectable()
export class MikroCategoriesRepository implements ICategoriesRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(
    filters?: FindCategoriesFilters,
  ): Promise<CategoryPage> {
    const pattern = likePattern(filters?.search);
    const deleted = filters?.deleted ?? false;

    const where: FilterQuery<MikroCategory> = {
      ...(deleted === true
        ? { deletedAt: { $ne: null } }
        : deleted === false
          ? { deletedAt: null }
          : {}),
      ...(pattern
        ? {
            $or: [
              { name: { $ilike: pattern } },
              { slug: { $ilike: pattern } },
              { description: { $ilike: pattern } },
            ],
          }
        : {}),
    };

    const [mikroCategories, total] = await this.entityManager.findAndCount(
      MikroCategory,
      where,
      {
        orderBy: { createdAt: 'desc' },
        ...(filters?.limit !== undefined ? { limit: filters.limit } : {}),
        ...(filters?.offset !== undefined ? { offset: filters.offset } : {}),
      },
    );

    return {
      items: mikroCategories.map((item) => CategoryMapper.toDomain(item)),
      total,
    };
  }

  public async findById(id: string): Promise<Category | null> {
    const mikroCategory = await this.entityManager.findOne(MikroCategory, {
      id,
      deletedAt: null,
    });

    if (!mikroCategory) return null;

    return CategoryMapper.toDomain(
      mikroCategory,
      await this.findProductIds(id),
    );
  }

  public async findByIdIncludingDeleted(id: string): Promise<Category | null> {
    const mikroCategory = await this.entityManager.findOne(MikroCategory, {
      id,
    });

    if (!mikroCategory) return null;

    return CategoryMapper.toDomain(
      mikroCategory,
      await this.findProductIds(id),
    );
  }

  public async existsByNameOrSlug(
    name: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const found = await this.entityManager.findOne(
      MikroCategory,
      {
        $or: [{ name }, { slug }],
        ...(excludeId ? { id: { $ne: excludeId } } : {}),
      },
      { fields: ['id'] },
    );

    return found !== null;
  }

  public async findProductIds(categoryId: string): Promise<string[]> {
    const rows = await this.entityManager.find(
      MikroProductCategory,
      { categoryId },
      { fields: ['productId'] },
    );

    return rows.map((row) => row.productId);
  }

  public create(category: Category): Promise<Category> {
    return this.persistCategory(new MikroCategory(), category, true);
  }

  public update(category: Category): Promise<Category> {
    const mikroCategory = this.entityManager.getReference(
      MikroCategory,
      category.getId(),
    );

    return this.persistCategory(mikroCategory, category, false);
  }

  private async persistCategory(
    mikroCategory: MikroCategory,
    category: Category,
    insert: boolean,
  ): Promise<Category> {
    try {
      CategoryMapper.assign(mikroCategory, category);

      if (insert) {
        this.entityManager.persist(mikroCategory);
      }

      await this.entityManager.flush();
      await this.syncProductIds(category);

      return CategoryMapper.toDomain(mikroCategory, [
        ...category.getProductIds(),
      ]);
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new CategoryAlreadyExistsException(category.getName());
      }

      throw error;
    }
  }

  /** Thay thế toàn bộ liên kết sản phẩm của danh mục. */
  private async syncProductIds(category: Category): Promise<void> {
    const categoryId = category.getId();
    const productIds = category.getProductIds();

    await this.entityManager.nativeDelete(MikroProductCategory, { categoryId });

    if (productIds.length > 0) {
      const links = productIds.map((productId) => {
        const link = new MikroProductCategory();
        link.categoryId = categoryId;
        link.productId = productId;

        return link;
      });

      await this.entityManager.insertMany(MikroProductCategory, links);
    }
  }
}
