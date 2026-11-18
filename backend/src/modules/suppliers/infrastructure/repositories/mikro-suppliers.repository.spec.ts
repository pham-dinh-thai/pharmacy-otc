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
  const findAll = jest.fn<
    (entity: unknown, options: unknown) => Promise<any[]>
  >(() => Promise.resolve([]));
  const findOne = jest.fn<(entity: unknown, where: unknown) => Promise<any>>(
    () => Promise.resolve(null),
  );
  const entityManager = { findAll, findOne } as unknown as EntityManager;

  return {
    repository: new MikroSuppliersRepository(entityManager),
    findAll,
    findOne,
  };
};

describe('MikroSuppliersRepository', () => {
  describe('findAll', () => {
    it('excludes soft-deleted suppliers by default and keeps createdAt desc ordering', async () => {
      const { repository, findAll } = setup();

      await repository.findAll();

      expect(findAll).toHaveBeenCalledWith(MikroSupplier, {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns only soft-deleted suppliers when deleted is true', async () => {
      const { repository, findAll } = setup();

      await repository.findAll({ deleted: true });

      expect(findAll).toHaveBeenCalledWith(MikroSupplier, {
        where: { deletedAt: { $ne: null } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('searches code, name, phone, email and taxCode case-insensitively', async () => {
      const { repository, findAll } = setup();

      await repository.findAll({ search: '  abc  ' });

      const where = findAll.mock.calls[0][1] as {
        where: Record<string, unknown>;
      };
      expect(where.where.deletedAt).toBeNull();
      expect(where.where.$or).toEqual([
        { code: { $ilike: '%abc%' } },
        { name: { $ilike: '%abc%' } },
        { phone: { $ilike: '%abc%' } },
        { email: { $ilike: '%abc%' } },
        { taxCode: { $ilike: '%abc%' } },
      ]);
    });

    it('escapes LIKE wildcards in the search term', async () => {
      const { repository, findAll } = setup();

      await repository.findAll({ search: '50%_' });

      const where = findAll.mock.calls[0][1] as {
        where: { $or: { code: { $ilike: string } }[] };
      };
      expect(where.where.$or[0].code.$ilike).toBe('%50\\%\\_%');
    });

    it('maps persisted deletedAt onto the domain supplier', async () => {
      const { repository, findAll } = setup();
      findAll.mockResolvedValue([persistentSupplier(DELETED_AT)]);

      const [supplier] = await repository.findAll({ deleted: true });

      expect(supplier.isDeleted()).toBe(true);
      expect(supplier.getDeletedAt()).toEqual(DELETED_AT);
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
