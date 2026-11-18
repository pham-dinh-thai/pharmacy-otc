import { describe, expect, it, jest } from '@jest/globals';
import {
  FindSuppliersFilters,
  ISuppliersRepository,
  SupplierPage,
} from '../../../domain/suppliers.repository';
import { Supplier } from '../../../domain/supplier.aggregate';
import { GetSuppliersQuery } from './get-suppliers.query';
import { GetSuppliersHandler } from './get-suppliers.handler';

type FindPage = (filters?: FindSuppliersFilters) => Promise<SupplierPage>;
type FindById = (id: string) => Promise<Supplier | null>;
type NextSequence = () => Promise<number>;
type Create = (supplier: Supplier) => Promise<Supplier>;
type Update = (supplier: Supplier) => Promise<Supplier>;

const FIRST_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const SECOND_ID = '0ca741a6-ce41-4010-8148-f7b2a32aef1c';

const createSupplier = (
  id: string,
  code: string,
  name: string,
  createdAt: Date,
  deletedAt: Date | null = null,
): Supplier =>
  Supplier.fromPersistent({
    id,
    code,
    name,
    phone: '0901234567',
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@abc.vn`,
    address: '12 Nguyễn Huệ',
    taxCode: '0312345678',
    createdAt,
    updatedAt: createdAt,
    deletedAt,
  });

const setup = (items: Supplier[], total = items.length) => {
  const findPage = jest.fn<FindPage>(() => Promise.resolve({ items, total }));

  const repository: ISuppliersRepository = {
    findPage,
    findById: jest.fn<FindById>(),
    findByIdIncludingDeleted: jest.fn<FindById>(),
    nextSequence: jest.fn<NextSequence>(),
    create: jest.fn<Create>(),
    update: jest.fn<Update>(),
  };
  const handler = new GetSuppliersHandler(repository);

  return { handler, findPage };
};

describe('GetSuppliersHandler', () => {
  it('maps suppliers to a page and keeps repository order', async () => {
    const newest = createSupplier(
      FIRST_ID,
      'SUP-0002',
      'Công ty ABC',
      new Date('2026-02-01T00:00:00Z'),
    );
    const oldest = createSupplier(
      SECOND_ID,
      'SUP-0001',
      'Công ty XYZ',
      new Date('2026-01-01T00:00:00Z'),
    );
    const { handler, findPage } = setup([newest, oldest], 2);

    const result = await handler.execute(new GetSuppliersQuery());

    expect(findPage).toHaveBeenCalledWith({
      deleted: undefined,
      search: undefined,
      limit: 20,
      offset: 0,
    });
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      id: FIRST_ID,
      code: 'SUP-0002',
      name: 'Công ty ABC',
      phone: '0901234567',
      email: 'công.ty.abc@abc.vn',
      address: '12 Nguyễn Huệ',
      taxCode: '0312345678',
      createdAt: new Date('2026-02-01T00:00:00Z'),
      updatedAt: new Date('2026-02-01T00:00:00Z'),
      deletedAt: null,
    });
    expect(result.items[1].id).toBe(SECOND_ID);
    expect(result.items[1].code).toBe('SUP-0001');
  });

  it('includes deletedAt for soft-deleted list items', async () => {
    const deletedAt = new Date('2026-02-02T00:00:00Z');
    const deleted = createSupplier(
      SECOND_ID,
      'SUP-0001',
      'Công ty XYZ',
      new Date('2026-01-01T00:00:00Z'),
      deletedAt,
    );
    const { handler } = setup([deleted]);

    const result = await handler.execute(new GetSuppliersQuery(true));

    expect(result.items[0].deletedAt).toEqual(deletedAt);
  });

  it('forwards filters and pagination to the repository', async () => {
    const { handler, findPage } = setup([]);

    await handler.execute(new GetSuppliersQuery(true, 'abc', 3, 10));

    expect(findPage).toHaveBeenCalledWith({
      deleted: true,
      search: 'abc',
      limit: 10,
      offset: 20,
    });
  });

  it('returns an empty page when there are no suppliers', async () => {
    const { handler } = setup([]);

    await expect(
      handler.execute(new GetSuppliersQuery()),
    ).resolves.toMatchObject({ items: [], total: 0 });
  });
});
