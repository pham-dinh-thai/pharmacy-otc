import { describe, expect, it } from '@jest/globals';
import { InvalidEmployeePositionException } from './exceptions/employee.exceptions';
import { Employee } from './employee.aggregate';
import { EmployeePosition } from './enums/employee-position.enum';

const baseProps = {
  userId: '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50',
  departmentId: 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c',
};

describe('Employee position', () => {
  it('accepts a value from the position enum', () => {
    const employee = Employee.create({
      ...baseProps,
      position: EmployeePosition.DEPARTMENT_HEAD,
    });

    expect(employee.getPosition()).toBe(EmployeePosition.DEPARTMENT_HEAD);
  });

  it('keeps position optional', () => {
    const employee = Employee.create(baseProps);

    expect(employee.getPosition()).toBeNull();
  });

  it('rejects a free-text position outside the enum', () => {
    expect(() =>
      Employee.create({
        ...baseProps,
        position: 'Nhân viên nhân viên' as EmployeePosition,
      }),
    ).toThrow(InvalidEmployeePositionException);
  });

  it('rejects a position that differs only by casing', () => {
    expect(() =>
      Employee.create({
        ...baseProps,
        position: 'nhân viên' as EmployeePosition,
      }),
    ).toThrow(InvalidEmployeePositionException);
  });
});
