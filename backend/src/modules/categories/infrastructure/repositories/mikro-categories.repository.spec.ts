import { describe, expect, it, jest } from '@jest/globals';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import { MikroCategoriesRepository } from './mikro-categories.repository';
import { MikroCategory } from '../entities/mikro-category.entity';
import { MikroProductCategory } from '../entities/mikro-product-category.entity';
import { Category } from '../../domain/category.aggregate';
import { CategoryAlreadyExistsException } from '../../domain/exceptions/category.exceptions';

const CATEGORY_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const PRODUCT_ID_1 = '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d';
const PRODUCT_ID_2 = '9b781a20-0ab6-494a-9bfd-e475e07c7a17';
const DELETED_AT = new Date('2026-02-01T00:00:00Z');

const persistentCategory = (deletedAt: Date | null = null): MikroCategory =>
  Object.assign(new MikroCategory(), {
    id: CATEGORY_ID,
    name: 'Thuốc OTC',
    slug: 'thuoc-otc',
    description: null,
    deletedAt,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const category = (productIds: string[] = []): Category =>
  Category.fromPersistent({
    id: CATEGORY_ID,
    name: 'Thuốc OTC',
    slug: 'thuoc-otc',
    description: null,
    productIds,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const setup = () => {
  const findAndCount = jest.fn<
    (entity: unknown, where: unknown, options: unknown) => Promise<any[]>
  >(() => Promise.resolve([[], 0]));
  const findOne = jest.fn<
    (entity: unknown, where: unknown, options?: unknown) => Promise<any>
  >(() => Promise.resolve(null));
  const find = jest.fn<
    (entity: unknown, where: unknown, options?: unknown) => Promise<any[]>
  >(() => Promise.resolve([]));
  const persist = jest.fn<(entity: unknown) => void>();
  const flush = jest.fn<() => Promise<void>>(() => Promise.resolve());
  const nativeDelete = jest.fn<
    (entity: unknown, where: unknown) => Promise<number>
  >(() => Promise.resolve(0));
  const insertMany = jest.fn<
    (entity: unknown, data: unknown) => Promise<unknown[]>
  >(() => Promise.resolve([]));
  const getReference = jest.fn<(entity: unknown, id: unknown) => MikroCategory>(
    () => persistentCategory(),
  );

  const entityManager = {
    findAndCount,
    findOne,
    find,
    getReference,
    persist,
    flush,
    nativeDelete,
    insertMany,
  } as unknown as EntityManager;

  return {
    repository: new MikroCategoriesRepository(entityManager),
    findAndCount,
    findOne,
    find,
    persist,
    flush,
    nativeDelete,
    insertMany,
    getReference,
  };
};

describe('MikroCategoriesRepository', () => {
  describe('findPage', () => {
    it('excludes soft-deleted categories by default and keeps createdAt desc ordering', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage();

      expect(findAndCount).toHaveBeenCalledWith(
        MikroCategory,
        { deletedAt: null },
        { orderBy: { createdAt: 'desc' } },
      );
    });

    it('returns all categories when deleted is all', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({ deleted: 'all' });

      expect(findAndCount).toHaveBeenCalledWith(
        MikroCategory,
        {},
        { orderBy: { createdAt: 'desc' } },
      );
    });

    it('returns only soft-deleted categories when deleted is true', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({ deleted: true });

      expect(findAndCount).toHaveBeenCalledWith(
        MikroCategory,
        { deletedAt: { $ne: null } },
        { orderBy: { createdAt: 'desc' } },
      );
    });

    it('searches name, slug and description case-insensitively and escapes LIKE wildcards', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({ search: '  otc%_  ' });

      const where = findAndCount.mock.calls[0][1] as {
        deletedAt: null;
        $or: { name: { $ilike: string } }[];
      };
      expect(where.deletedAt).toBeNull();
      expect(where.$or).toEqual([
        { name: { $ilike: '%otc\\%\\_%' } },
        { slug: { $ilike: '%otc\\%\\_%' } },
        { description: { $ilike: '%otc\\%\\_%' } },
      ]);
    });

    it('passes limit and offset to MikroORM and maps the total', async () => {
      const { repository, findAndCount } = setup();
      findAndCount.mockResolvedValue([[persistentCategory(DELETED_AT)], 1]);

      const result = await repository.findPage({ limit: 10, offset: 20 });

      const options = findAndCount.mock.calls[0][2] as {
        orderBy: unknown;
        limit: number;
        offset: number;
      };
      expect(options).toEqual({
        orderBy: { createdAt: 'desc' },
        limit: 10,
        offset: 20,
      });
      expect(result.total).toBe(1);
      expect(result.items[0].isDeleted()).toBe(true);
    });
  });

  describe('lookups', () => {
    it('findById excludes soft-deleted categories and loads product ids', async () => {
      const { repository, findOne, find } = setup();
      findOne.mockResolvedValue(persistentCategory());
      find.mockResolvedValue([{ productId: PRODUCT_ID_1 }]);

      const result = await repository.findById(CATEGORY_ID);

      expect(findOne).toHaveBeenCalledWith(MikroCategory, {
        id: CATEGORY_ID,
        deletedAt: null,
      });
      expect(find).toHaveBeenCalledWith(
        MikroProductCategory,
        { categoryId: CATEGORY_ID },
        { fields: ['productId'] },
      );
      expect(result?.getProductIds()).toEqual([PRODUCT_ID_1]);
    });

    it('findByIdIncludingDeleted returns a soft-deleted category', async () => {
      const { repository, findOne } = setup();
      findOne.mockResolvedValue(persistentCategory(DELETED_AT));

      const result = await repository.findByIdIncludingDeleted(CATEGORY_ID);

      expect(findOne).toHaveBeenCalledWith(MikroCategory, { id: CATEGORY_ID });
      expect(result?.isDeleted()).toBe(true);
      expect(result?.getDeletedAt()).toEqual(DELETED_AT);
    });

    it('checks duplicate name or slug while excluding an id on update', async () => {
      const { repository, findOne } = setup();

      await repository.existsByNameOrSlug(
        'Thuốc OTC',
        'thuoc-otc',
        CATEGORY_ID,
      );

      expect(findOne).toHaveBeenCalledWith(
        MikroCategory,
        {
          $or: [{ name: 'Thuốc OTC' }, { slug: 'thuoc-otc' }],
          id: { $ne: CATEGORY_ID },
        },
        { fields: ['id'] },
      );
    });
  });

  describe('writes', () => {
    it('persists a new category and replaces its product links', async () => {
      const { repository, persist, flush, nativeDelete, insertMany } = setup();

      await repository.create(category([PRODUCT_ID_1, PRODUCT_ID_2]));

      expect(persist).toHaveBeenCalledTimes(1);
      expect(flush).toHaveBeenCalledTimes(1);
      expect(nativeDelete).toHaveBeenCalledWith(MikroProductCategory, {
        categoryId: CATEGORY_ID,
      });
      expect(insertMany).toHaveBeenCalledWith(MikroProductCategory, [
        Object.assign(new MikroProductCategory(), {
          categoryId: CATEGORY_ID,
          productId: PRODUCT_ID_1,
        }),
        Object.assign(new MikroProductCategory(), {
          categoryId: CATEGORY_ID,
          productId: PRODUCT_ID_2,
        }),
      ]);
    });

    it('uses a managed reference on update and skips inserts when there are no links', async () => {
      const { repository, persist, nativeDelete, insertMany, getReference } =
        setup();

      await repository.update(category());

      expect(getReference).toHaveBeenCalledWith(MikroCategory, CATEGORY_ID);
      expect(persist).not.toHaveBeenCalled();
      expect(nativeDelete).toHaveBeenCalledWith(MikroProductCategory, {
        categoryId: CATEGORY_ID,
      });
      expect(insertMany).not.toHaveBeenCalled();
    });

    it('maps a unique constraint violation to a domain exception', async () => {
      const { repository, flush } = setup();
      flush.mockRejectedValue(
        new UniqueConstraintViolationException(new Error('duplicate key')),
      );

      await expect(repository.create(category())).rejects.toThrow(
        CategoryAlreadyExistsException,
      );
    });
  });
});
