import { describe, expect, it, jest } from '@jest/globals';
import { ISuppliersRepository } from '../../../domain/suppliers.repository';
import { Supplier } from '../../../domain/supplier.aggregate';
import { SupplierNotFoundException } from '../../../domain/exceptions/supplier.exceptions';
import { GetSupplierHandler } from './get-supplier.handler';
import { GetSupplierQuery } from './get-supplier.query';

const SUPPLIER_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const DELETED_AT = new Date('2026-02-01T00:00:00Z');
const CREATED_AT = new Date('2026-01-01T00:00:00Z');

const createSupplier = (deletedAt?: Date | null): Supplier =>
  Supplier.fromPersistent({
    id: SUPPLIER_ID,
    code: 'SUP-0007',
    name: 'Công ty TNHH ABC',
    phone: '0901234567',
    email: 'contact@abc.vn',
    address: '12 Nguyễn Huệ',
    taxCode: '0312345678',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt,
  });

const setup = (supplier: Supplier | null) => {
  const findByIdIncludingDeleted = jest.fn<
    (id: string) => Promise<Supplier | null>
  >(() => Promise.resolve(supplier));

  const repository = {
    findByIdIncludingDeleted,
  } as unknown as ISuppliersRepository;

  return {
    handler: new GetSupplierHandler(repository),
    findByIdIncludingDeleted,
  };
};

describe('GetSupplierHandler', () => {
  it('returns the detail read model, including deletedAt, for a deleted supplier', async () => {
    const { handler, findByIdIncludingDeleted } = setup(
      createSupplier(DELETED_AT),
    );

    const result = await handler.execute(new GetSupplierQuery(SUPPLIER_ID));

    expect(findByIdIncludingDeleted).toHaveBeenCalledWith(SUPPLIER_ID);
    expect(result).toEqual({
      id: SUPPLIER_ID,
      code: 'SUP-0007',
      name: 'Công ty TNHH ABC',
      phone: '0901234567',
      email: 'contact@abc.vn',
      address: '12 Nguyễn Huệ',
      taxCode: '0312345678',
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
      deletedAt: DELETED_AT,
    });
  });

  it('returns a null deletedAt for a supplier that is not deleted', async () => {
    const { handler } = setup(createSupplier());

    const result = await handler.execute(new GetSupplierQuery(SUPPLIER_ID));

    expect(result.deletedAt).toBeNull();
  });

  it('throws for an unknown supplier id', async () => {
    const { handler } = setup(null);

    await expect(
      handler.execute(new GetSupplierQuery(SUPPLIER_ID)),
    ).rejects.toThrow(SupplierNotFoundException);
  });
});
