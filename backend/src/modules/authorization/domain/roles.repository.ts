import { type TriStateFilter } from '../../../shared/utils/list-filters';
import { PermissionKey } from './permission/permission-catalog';
import { Role } from './role.aggregate';

export type RolePage = {
  items: Role[];
  total: number;
};

export type FindRolesOptions = {
  limit: number;
  offset: number;
  search?: string;
  deleted?: TriStateFilter;
  isSuperAdmin?: TriStateFilter;
};

export interface IRolesRepository {
  findPage(options: FindRolesOptions): Promise<RolePage>;

  findById(id: string): Promise<Role | null>;

  findByName(name: string): Promise<Role | null>;

  findAccessByRoleIds(
    ids: string[],
  ): Promise<{ isSuperAdmin: boolean; permissions: PermissionKey[] }>;

  create(role: Role): Promise<Role>;

  update(role: Role): Promise<Role>;
}

export const ROLES_REPOSITORY = 'IRolesRepository';
