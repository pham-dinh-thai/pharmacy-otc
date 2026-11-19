import { describe, expect, it, jest } from '@jest/globals';
import { Employee } from '../../../domain/employee.aggregate';
import { EmployeePosition } from '../../../domain/enums/employee-position.enum';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import {
  type EmployeePage,
  type FindEmployeesOptions,
  IEmployeesRepository,
} from '../../../domain/employees.repository';
import { EmployeeReadModel } from '../employee.read-model';
import { EmployeeReadModelFactory } from '../employee-read-model.factory';
import { GetEmployeesHandler } from './get-employees.handler';
import { GetEmployeesQuery } from './get-employees.query';

const EMPLOYEE_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const DEPARTMENT_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const readModel = (): EmployeeReadModel =>
  new EmployeeReadModel(
    EMPLOYEE_ID,
    '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
    'Nguyen',
    'Van A',
    'nguyen@example.com',
    DEPARTMENT_ID,
    'Pharmacy',
    null,
    EmployeeStatus.WORKING,
    true,
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-01T00:00:00Z'),
  );

const setup = (items: Employee[], total = items.length) => {
  const findPage = jest.fn<
    (options: FindEmployeesOptions) => Promise<EmployeePage>
  >(() => Promise.resolve({ items, total }));
  const create = jest.fn<(employee: Employee) => Promise<EmployeeReadModel>>(
    () => Promise.resolve(readModel()),
  );
  const repository = { findPage } as unknown as IEmployeesRepository;
  const factory = { create } as unknown as EmployeeReadModelFactory;

  return {
    handler: new GetEmployeesHandler(repository, factory),
    findPage,
    create,
  };
};

describe('GetEmployeesHandler', () => {
  it('uses page 1 and limit 20 by default', async () => {
    const employee = {} as Employee;
    const { handler, findPage, create } = setup([employee], 13);

    const result = await handler.execute(new GetEmployeesQuery());

    expect(findPage).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      search: undefined,
      departmentId: undefined,
      position: undefined,
      status: undefined,
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ total: 13, page: 1, limit: 20 });
    expect(result.items[0].id).toBe(EMPLOYEE_ID);
  });

  it('forwards every filter to the repository', async () => {
    const { handler, findPage } = setup([]);

    await handler.execute(
      new GetEmployeesQuery({
        page: 2,
        limit: 10,
        search: ' nguyen ',
        departmentId: DEPARTMENT_ID,
        position: EmployeePosition.PHARMACIST,
        status: EmployeeStatus.WORKING,
      }),
    );

    expect(findPage).toHaveBeenCalledWith({
      limit: 10,
      offset: 10,
      search: 'nguyen',
      departmentId: DEPARTMENT_ID,
      position: EmployeePosition.PHARMACIST,
      status: EmployeeStatus.WORKING,
    });
  });

  it('clamps page and limit to the documented range', async () => {
    const { handler, findPage } = setup([]);

    await handler.execute(new GetEmployeesQuery({ page: -5, limit: 0 }));

    expect(findPage).toHaveBeenCalledWith({
      limit: 1,
      offset: 0,
      search: undefined,
      departmentId: undefined,
      position: undefined,
      status: undefined,
    });
  });
});
