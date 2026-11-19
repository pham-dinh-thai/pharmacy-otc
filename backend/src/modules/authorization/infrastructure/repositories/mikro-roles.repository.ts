import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntityManager,
  type FilterQuery,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import {
  type FindRolesOptions,
  type IRolesRepository,
  type RolePage,
} from '../../domain/roles.repository';
import { Role } from '../../domain/role.aggregate';
import { likePattern } from '../../../../shared/utils/list-filters';
import { RoleMapper } from '../mappers/role.mapper';
import { MikroRole } from '../entities/mikro-role.entity';
import { PermissionKey } from '../../domain/permission/permission-catalog';

@Injectable()
export class MikroRolesRepository implements IRolesRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(options: FindRolesOptions): Promise<RolePage> {
    const pattern = likePattern(options.search);
    const where: FilterQuery<MikroRole> = {
      ...(options.deleted === true
        ? { deletedAt: { $ne: null } }
        : options.deleted === false
          ? { deletedAt: null }
          : {}),
      ...(typeof options.isSuperAdmin === 'boolean'
        ? { isSuperAdmin: options.isSuperAdmin }
        : {}),
      ...(pattern ? { name: { $ilike: pattern } } : {}),
    };

    const [mikroRoles, total] = await this.entityManager.findAndCount(
      MikroRole,
      where,
      {
        orderBy: { createdAt: 'desc' },
        limit: options.limit,
        offset: options.offset,
      },
    );

    return {
      items: mikroRoles.map((mikroRole) => RoleMapper.toDomain(mikroRole)),
      total,
    };
  }

  public async findById(id: string): Promise<Role | null> {
    const mikroRole = await this.entityManager.findOne(MikroRole, { id });

    return mikroRole ? RoleMapper.toDomain(mikroRole) : null;
  }

  public async findByName(name: string): Promise<Role | null> {
    const mikroRole = await this.entityManager.findOne(MikroRole, { name });

    return mikroRole ? RoleMapper.toDomain(mikroRole) : null;
  }

  public async findAccessByRoleIds(
    ids: string[],
  ): Promise<{ isSuperAdmin: boolean; permissions: PermissionKey[] }> {
    if (ids.length === 0) {
      return { isSuperAdmin: false, permissions: [] };
    }

    const mikroRoles = await this.entityManager.find(
      MikroRole,
      { id: { $in: ids }, deletedAt: null },
      { fields: ['permissions', 'isSuperAdmin'] },
    );

    const permissions = mikroRoles.flatMap((role) => role.permissions);

    return {
      isSuperAdmin: mikroRoles.some((role) => role.isSuperAdmin),
      permissions: [...new Set(permissions)] as PermissionKey[],
    };
  }

  public create(role: Role): Promise<Role> {
    return this.persistRole(new MikroRole(), role, true);
  }

  public async update(role: Role): Promise<Role> {
    const mikroRole = await this.entityManager.findOne(MikroRole, {
      id: role.getId(),
    });

    if (!mikroRole) {
      throw new NotFoundException(`Role id ${role.getId()} not found`);
    }

    return this.persistRole(mikroRole, role, false);
  }

  private async persistRole(
    mikroRole: MikroRole,
    role: Role,
    insert: boolean,
  ): Promise<Role> {
    try {
      RoleMapper.assign(mikroRole, role);

      if (insert) {
        this.entityManager.persist(mikroRole);
      }

      await this.entityManager.flush();

      return RoleMapper.toDomain(mikroRole);
    } catch (e) {
      if (e instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Role name already exists');
      }

      throw e;
    }
  }
}
