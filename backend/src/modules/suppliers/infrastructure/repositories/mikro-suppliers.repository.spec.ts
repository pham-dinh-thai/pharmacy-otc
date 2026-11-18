import { describe, expect, it, jest } from '@jest/globals';
import { type EntityManager } from '@mikro-orm/core';
import { MikroSuppliersRepository } from './mikro-suppliers.repository';
import { MikroSupplier } from '../entities/mikro-supplier.entity';

const SUPPLIER_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const DELETED_AT = new Date('2026-02-01T00:00:00Z');

const persistentSupplier = (deletedAt: Date | null = null): MikroSupplier =>
  Object.assign(new MikroSupplier(), {
    id: SUPPLIER_ID,
    code: 'SUP-0007',
    name: 'Công ty TNHH ABC',
    deletedAt,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    phone: '0901234567',
    email: 'contact@abc.vn',
    address: '12 Nguyễn Huệ',
    taxCode: '0312345678',
  });

const setup = () => {
  const findAndCount = jest.fn<
    (entity: unknown, where: unknown, options: unknown) => Promise<any[]>
  >(() => Promise.resolve([[], 0]));
  const findOne = jest.fn<(entity: unknown, where: unknown) => Promise<any>>(
    () => Promise.resolve(null),
  );
  const entityManager = { findAndCount, findOne } as unknown as EntityManager;

  return {
    repository: new MikroSuppliersRepository(entityManager),
    findAndCount,
    findOne,
  };
};

describe('MikroSuppliersRepository', () => {
  describe('findPage', () => {
    it('excludes soft-deleted suppliers by default and keeps createdAt desc ordering', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage();

      expect(findAndCount).toHaveBeenCalledWith(
        MikroSupplier,
        { deletedAt: null },
        { orderBy: { createdAt: 'desc' } },
      );
    });

    it('returns only soft-deleted suppliers when deleted is true', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({ deleted: true });

      expect(findAndCount).toHaveBeenCalledWith(
        MikroSupplier,
        { deletedAt: { $ne: null } },
        { orderBy: { createdAt: 'desc' } },
      );
    });

    it('searches code, name, phone, email and taxCode case-insensitively', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({ search: '  abc  ' });

      const where = findAndCount.mock.calls[0][1] as Record<string, unknown>;
      expect(where.deletedAt).toBeNull();
      expect(where.$or).toEqual([
        { code: { $ilike: '%abc%' } },
        { name: { $ilike: '%abc%' } },
        { phone: { $ilike: '%abc%' } },
        { email: { $ilike: '%abc%' } },
        { taxCode: { $ilike: '%abc%' } },
      ]);
    });

    it('escapes LIKE wildcards in the search term', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({ search: '50%_' });

      const where = findAndCount.mock.calls[0][1] as {
        $or: { code: { $ilike: string } }[];
      };
      expect(where.$or[0].code.$ilike).toBe('%50\\%\\_%');
    });

    it('passes limit and offset to MikroORM', async () => {
      const { repository, findAndCount } = setup();

      await repository.findPage({ limit: 10, offset: 20 });

      const options = findAndCount.mock.calls[0][2] as {
        limit: number;
        offset: number;
      };
      expect(options.limit).toBe(10);
      expect(options.offset).toBe(20);
    });

    it('maps persisted deletedAt onto the domain supplier and returns the total', async () => {
      const { repository, findAndCount } = setup();
      findAndCount.mockResolvedValue([[persistentSupplier(DELETED_AT)], 1]);

      const result = await repository.findPage({ deleted: true });

      expect(result.total).toBe(1);
      expect(result.items[0].isDeleted()).toBe(true);
      expect(result.items[0].getDeletedAt()).toEqual(DELETED_AT);
    });
  });

  describe('lookups', () => {
    it('findById excludes soft-deleted suppliers', async () => {
      const { repository, findOne } = setup();

      await repository.findById(SUPPLIER_ID);

      expect(findOne).toHaveBeenCalledWith(MikroSupplier, {
        id: SUPPLIER_ID,
        deletedAt: null,
      });
    });

    it('findByIdIncludingDeleted finds a soft-deleted supplier', async () => {
      const { repository, findOne } = setup();
      findOne.mockResolvedValue(persistentSupplier(DELETED_AT));

      const supplier = await repository.findByIdIncludingDeleted(SUPPLIER_ID);

      expect(findOne).toHaveBeenCalledWith(MikroSupplier, { id: SUPPLIER_ID });
      expect(supplier?.isDeleted()).toBe(true);
      expect(supplier?.getDeletedAt()).toEqual(DELETED_AT);
    });
  });
});
