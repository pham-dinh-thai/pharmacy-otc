import { describe, expect, it } from '@jest/globals';
import {
  SupplierAlreadyDeletedException,
  SupplierNotDeletedException,
} from './exceptions/supplier.exceptions';
import { Supplier } from './supplier.aggregate';

const SUPPLIER_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const createSupplier = (deletedAt?: Date | null): Supplier =>
  Supplier.fromPersistent({
    id: SUPPLIER_ID,
    code: 'SUP-0007',
    name: 'Công ty TNHH ABC',
    phone: '0901234567',
    email: 'contact@abc.vn',
    address: '12 Nguyễn Huệ',
    taxCode: '0312345678',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt,
  });

describe('Supplier', () => {
  it('creates a supplier that is not deleted', () => {
    const supplier = Supplier.create({
      sequence: 7,
      name: 'Công ty TNHH ABC',
      phone: '0901234567',
      email: 'contact@abc.vn',
      address: '12 Nguyễn Huệ',
      taxCode: '0312345678',
    });

    expect(supplier.isDeleted()).toBe(false);
    expect(supplier.getDeletedAt()).toBeNull();
  });

  it('soft-deletes a supplier and stamps deletedAt', () => {
    const supplier = createSupplier();

    supplier.softDelete();

    expect(supplier.isDeleted()).toBe(true);
    expect(supplier.getDeletedAt()).toBeInstanceOf(Date);
  });

  it('does not soft-delete a supplier twice', () => {
    const supplier = createSupplier();
    supplier.softDelete();

    expect(() => supplier.softDelete()).toThrow(
      SupplierAlreadyDeletedException,
    );
  });

  it('restores a soft-deleted supplier', () => {
    const supplier = createSupplier(new Date('2026-02-01T00:00:00Z'));

    supplier.restore();

    expect(supplier.isDeleted()).toBe(false);
    expect(supplier.getDeletedAt()).toBeNull();
  });

  it('does not restore a supplier that is not deleted', () => {
    expect(() => createSupplier().restore()).toThrow(
      SupplierNotDeletedException,
    );
  });

  it('preserves deletedAt when rehydrated from persistence', () => {
    const deletedAt = new Date('2026-02-01T00:00:00Z');

    const supplier = createSupplier(deletedAt);

    expect(supplier.isDeleted()).toBe(true);
    expect(supplier.getDeletedAt()).toEqual(deletedAt);
  });
});
