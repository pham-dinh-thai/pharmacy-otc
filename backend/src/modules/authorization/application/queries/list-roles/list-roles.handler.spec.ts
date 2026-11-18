import { describe, expect, it, jest } from '@jest/globals';
import {
  type FindRolesOptions,
  IRolesRepository,
  type RolePage,
} from '../../../domain/roles.repository';
import { Role } from '../../../domain/role.aggregate';
import { ListRolesHandler } from './list-roles.handler';
import { ListRolesQuery } from './list-roles.query';

const ROLE_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const role = (name: string, isSuperAdmin = false): Role =>
  Role.fromPersistent({
    id: ROLE_ID,
    name,
    permissions: [],
    isSuperAdmin,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const setup = (items: Role[], total = items.length) => {
  const findPage = jest.fn<(options: FindRolesOptions) => Promise<RolePage>>(
    () => Promise.resolve({ items, total }),
  );
  const repository = { findPage } as unknown as IRolesRepository;

  return { handler: new ListRolesHandler(repository), findPage };
};

describe('ListRolesHandler', () => {
  it('uses page 1 and limit 20 by default', async () => {
    const { handler, findPage } = setup([role('Pharmacist', true)], 11);

    const result = await handler.execute(new ListRolesQuery());

    expect(findPage).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    expect(result).toMatchObject({ total: 11, page: 1, limit: 20 });
    expect(result.items[0]).toMatchObject({
      id: ROLE_ID,
      name: 'Pharmacist',
      isSuperAdmin: true,
    });
  });

  it('forwards page and limit as an offset', async () => {
    const { handler, findPage } = setup([]);

    await handler.execute(new ListRolesQuery(3, 10));

    expect(findPage).toHaveBeenCalledWith({ limit: 10, offset: 20 });
  });

  it('clamps page and limit to the documented range', async () => {
    const { handler, findPage } = setup([]);

    await handler.execute(new ListRolesQuery(0, 500));

    expect(findPage).toHaveBeenCalledWith({ limit: 100, offset: 0 });
  });
});
