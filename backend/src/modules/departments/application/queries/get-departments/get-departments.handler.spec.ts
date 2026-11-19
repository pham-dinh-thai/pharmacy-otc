import { describe, expect, it, jest } from '@jest/globals';
import { Department } from '../../../domain/department.aggregate';
import {
  type DepartmentPage,
  type FindDepartmentsOptions,
  IDepartmentsRepository,
} from '../../../domain/departments.repository';
import { GetDepartmentsHandler } from './get-departments.handler';
import { GetDepartmentsQuery } from './get-departments.query';

const DEPARTMENT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const department = (name: string, deletedAt: Date | null = null): Department =>
  Department.fromPersistent({
    id: DEPARTMENT_ID,
    name,
    deletedAt,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const setup = (items: Department[], total = items.length) => {
  const findPage = jest.fn<
    (options: FindDepartmentsOptions) => Promise<DepartmentPage>
  >(() => Promise.resolve({ items, total }));
  const repository = { findPage } as unknown as IDepartmentsRepository;

  return { handler: new GetDepartmentsHandler(repository), findPage };
};

describe('GetDepartmentsHandler', () => {
  it('uses page 1 and limit 20 by default', async () => {
    const { handler, findPage } = setup([department('Pharmacy')], 11);

    const result = await handler.execute(new GetDepartmentsQuery());

    expect(findPage).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      search: undefined,
      deleted: 'all',
    });
    expect(result).toMatchObject({ total: 11, page: 1, limit: 20 });
    expect(result.items[0]).toMatchObject({
      id: DEPARTMENT_ID,
      name: 'Pharmacy',
      deletedAt: null,
    });
  });

  it('forwards page, limit, search and deleted filter', async () => {
    const { handler, findPage } = setup([]);

    await handler.execute(
      new GetDepartmentsQuery({
        page: 3,
        limit: 10,
        search: '  kho  ',
        deleted: true,
      }),
    );

    expect(findPage).toHaveBeenCalledWith({
      limit: 10,
      offset: 20,
      search: 'kho',
      deleted: true,
    });
  });

  it('clamps page and limit to the documented range', async () => {
    const { handler, findPage } = setup([]);

    await handler.execute(new GetDepartmentsQuery({ page: 0, limit: 500 }));

    expect(findPage).toHaveBeenCalledWith({
      limit: 100,
      offset: 0,
      search: undefined,
      deleted: 'all',
    });
  });

  it('keeps deletedAt on list items', async () => {
    const deletedAt = new Date('2026-02-01T00:00:00Z');
    const { handler } = setup([department('Old', deletedAt)]);

    const result = await handler.execute(new GetDepartmentsQuery());

    expect(result.items[0].deletedAt).toEqual(deletedAt);
  });
});
