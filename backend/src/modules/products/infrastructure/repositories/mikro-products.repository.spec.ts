import { describe, expect, it, jest } from '@jest/globals';
import { EntityManager } from '@mikro-orm/postgresql';
import { MikroProductsRepository } from './mikro-products.repository';
import { MikroProduct } from '../entities/mikro-product.entity';
import { MikroProductCategory } from '../../../categories/infrastructure/entities/mikro-product-category.entity';
import { Product } from '../../domain/product.aggregate';

const PRODUCT_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const CATEGORY_ID_1 = '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d';
const CATEGORY_ID_2 = '9b781a20-0ab6-494a-9bfd-e475e07c7a17';
const DELETED_AT = new Date('2026-02-01T00:00:00Z');

const persistentProduct = (deletedAt: Date | null = null): MikroProduct =>
  Object.assign(new MikroProduct(), {
    id: PRODUCT_ID,
    name: 'Thuốc OTC',
    unitPrice: 12500n,
    quantity: 10,
    deletedAt,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const product = (categoryIds: string[] = []): Product =>
  Product.fromPersistent({
    id: PRODUCT_ID,
    name: 'Thuốc OTC',
    unitPrice: '12500',
    quantity: 10,
    categoryIds,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const setup = () => {
  const findAndCount = jest.fn<
    (entity: unknown, where: unknown, options?: unknown) => Promise<any[]>
  >(() => Promise.resolve([[], 0]));
  const findOne = jest.fn<(entity: unknown, where: unknown) => Promise<any>>(
    () => Promise.resolve(null),
  );
  const find = jest.fn<
    (entity: unknown, where: unknown, options?: unknown) => Promise<any[]>
  >((entity) =>
    Promise.resolve(
      entity === MikroProductCategory ? [{ categoryId: CATEGORY_ID_1 }] : [],
    ),
  );
  const persist = jest.fn<(entity: unknown) => void>();
  const flush = jest.fn<() => Promise<void>>(() => Promise.resolve());
  const nativeDelete = jest.fn<
    (entity: unknown, where: unknown) => Promise<number>
  >(() => Promise.resolve(0));
  const insertMany = jest.fn<
    (entity: unknown, data: unknown) => Promise<unknown[]>
  >(() => Promise.resolve([]));
  const getReference = jest.fn<(entity: unknown, id: unknown) => MikroProduct>(
    () => persistentProduct(),
  );

  return {
    repository: new MikroProductsRepository({
      findAndCount,
      findOne,
      find,
      getReference,
      persist,
      flush,
      nativeDelete,
      insertMany,
    } as unknown as EntityManager),
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

describe('MikroProductsRepository', () => {
  describe('findPage', () => {
    it('excludes deleted products by default and maps the categories of each item', async () => {
      const { repository, findAndCount } = setup();
      findAndCount.mockResolvedValue([[persistentProduct()], 1]);

      const result = await repository.findPage({ limit: 10, offset: 20 });

      expect(findAndCount).toHaveBeenCalledWith(
        MikroProduct,
        { deletedAt: null },
        { orderBy: { createdAt: 'desc' }, limit: 10, offset: 20 },
      );
      expect(result.total).toBe(1);
      expect(result.items[0].getCategoryIds()).toEqual([CATEGORY_ID_1]);
    });

    it('supports tri-state deleted and inStock filters', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({ deleted: 'all', inStock: true });

      expect(findAndCount.mock.calls[0][1]).toMatchObject({
        quantity: { $gt: 0 },
      });

      await repository.findPage({ deleted: true, inStock: false });

      expect(findAndCount.mock.calls[1][1]).toMatchObject({
        deletedAt: { $ne: null },
        quantity: 0,
      });
    });

    it('escapes LIKE wildcards and applies price bounds', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({
        search: '  otc%_ ',
        minPrice: '10000',
        maxPrice: '20000',
      });

      expect(findAndCount.mock.calls[0][1]).toMatchObject({
        name: { $ilike: '%otc\\%\\_%' },
        unitPrice: { $gte: 10000n, $lte: 20000n },
      });
    });

    it('restricts results to products linked to a category', async () => {
      const { repository, findAndCount, find } = setup();
      find.mockResolvedValueOnce([{ productId: PRODUCT_ID }]);

      await repository.findPage({ categoryId: CATEGORY_ID_1 });

      expect(findAndCount.mock.calls[0][1]).toMatchObject({
        id: { $in: [PRODUCT_ID] },
      });
    });
  });

  describe('detail lookups', () => {
    it('findById excludes deleted products while findByIdIncludingDeleted does not', async () => {
      const { repository, findOne } = setup();
      findOne.mockImplementation((_entity, where) =>
        Promise.resolve(
          (where as { deletedAt?: unknown }).deletedAt === null
            ? null
            : persistentProduct(DELETED_AT),
        ),
      );

      expect(await repository.findById(PRODUCT_ID)).toBeNull();
      expect(findOne).toHaveBeenCalledWith(MikroProduct, {
        id: PRODUCT_ID,
        deletedAt: null,
      });

      const result = await repository.findByIdIncludingDeleted(PRODUCT_ID);
      expect(findOne).toHaveBeenCalledWith(MikroProduct, { id: PRODUCT_ID });
      expect(result?.getDeletedAt()).toEqual(DELETED_AT);
    });
  });

  describe('writes', () => {
    it('replaces category links on create', async () => {
      const { repository, persist, flush, nativeDelete, insertMany } = setup();

      await repository.create(product([CATEGORY_ID_1, CATEGORY_ID_2]));

      expect(persist).toHaveBeenCalledTimes(1);
      expect(flush).toHaveBeenCalledTimes(1);
      expect(nativeDelete).toHaveBeenCalledWith(MikroProductCategory, {
        productId: PRODUCT_ID,
      });
      expect(insertMany).toHaveBeenCalledWith(MikroProductCategory, [
        Object.assign(new MikroProductCategory(), {
          productId: PRODUCT_ID,
          categoryId: CATEGORY_ID_1,
        }),
        Object.assign(new MikroProductCategory(), {
          productId: PRODUCT_ID,
          categoryId: CATEGORY_ID_2,
        }),
      ]);
    });

    it('uses a managed reference on update and skips inserts when no links remain', async () => {
      const { repository, persist, getReference, insertMany } = setup();

      await repository.update(product());

      expect(getReference).toHaveBeenCalledWith(MikroProduct, PRODUCT_ID);
      expect(persist).not.toHaveBeenCalled();
      expect(insertMany).not.toHaveBeenCalled();
    });
  });
});
