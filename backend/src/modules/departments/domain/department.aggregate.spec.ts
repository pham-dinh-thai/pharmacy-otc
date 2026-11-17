import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Department } from './department.aggregate';

describe('Department', () => {
  it('trims the name on create', () => {
    const department = Department.create({ name: '  Pharmacy  ' });

    expect(department.getName()).toBe('Pharmacy');
    expect(department.getDeletedAt()).toBeNull();
    expect(department.isDeleted()).toBe(false);
  });

  it('rejects a blank name', () => {
    expect(() => Department.create({ name: '   ' })).toThrow(
      UnprocessableEntityException,
    );
  });

  it('renames an active department and touches it', () => {
    const department = Department.create({ name: 'Old' });
    const previousUpdatedAt = department.getUpdatedAt();

    department.rename('New');

    expect(department.getName()).toBe('New');
    expect(department.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime(),
    );
  });

  it('does not rename a disabled department', () => {
    const department = Department.create({ name: 'Old' });
    department.softDelete();

    expect(() => department.rename('New')).toThrow(ConflictException);
    expect(department.getName()).toBe('Old');
  });

  it('soft-deletes and restores a department', () => {
    const department = Department.create({ name: 'Pharmacy' });

    department.softDelete();

    expect(department.isDeleted()).toBe(true);
    expect(department.getDeletedAt()).toBeInstanceOf(Date);

    department.restore();

    expect(department.isDeleted()).toBe(false);
    expect(department.getDeletedAt()).toBeNull();
  });

  it('rejects repeated soft-delete and restore', () => {
    const department = Department.create({ name: 'Pharmacy' });

    department.softDelete();
    expect(() => department.softDelete()).toThrow(ConflictException);

    department.restore();
    expect(() => department.restore()).toThrow(ConflictException);
  });
});
