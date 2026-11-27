import { Id } from '../../../shared/domain/value-objects/id.value-object';
import {
  DuplicatePermissionsException,
  InvalidPermissionException,
  RoleAlreadyDisabledException,
  RoleAlreadyHasPermissionException,
  RoleDisabledException,
  RoleMissingPermissionException,
  RoleNameRequiredException,
  RoleNameTooLongException,
  RoleNotDisabledException,
  SuperAdminRoleCannotBeDisabledException,
} from './exceptions/role.exceptions';
import {
  isPermissionKey,
  PermissionKey,
  permissionMatches,
  Resource,
} from './permission/permission-catalog';

const MAX_NAME_LENGTH = 50;

export type CreateRoleProps = {
  name: string;
  permissions?: PermissionKey[];
  isSuperAdmin?: boolean;
};

export type FromPersistentRoleProps = {
  id: string;
  name: string;
  permissions: PermissionKey[];
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export class Role {
  private constructor(
    private readonly id: Id,
    private name: string,
    private readonly permissions: Set<PermissionKey>,
    private isSuperAdmin: boolean,
    private deletedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateRoleProps): Role {
    const now = new Date();
    const permissions = props.permissions ?? [];

    Role.assertValidPermissions(permissions);
    Role.assertNoDuplicatePermissions(permissions);

    return new Role(
      Id.generate(),
      Role.normalizeName(props.name),
      new Set(permissions),
      props.isSuperAdmin ?? false,
      null,
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentRoleProps): Role {
    return new Role(
      Id.create(props.id),
      props.name,
      new Set(props.permissions),
      props.isSuperAdmin,
      props.deletedAt ?? null,
      props.createdAt,
      props.updatedAt,
    );
  }

  public rename(name: string): void {
    this.assertActive();
    this.name = Role.normalizeName(name);
    this.touch();
  }

  public grant(permission: PermissionKey): void {
    this.assertActive();
    Role.assertValidPermission(permission);

    if (this.permissions.has(permission)) {
      throw new RoleAlreadyHasPermissionException(permission);
    }

    this.permissions.add(permission);
    this.touch();
  }

  public revoke(permission: PermissionKey): void {
    this.assertActive();
    Role.assertValidPermission(permission);

    if (!this.permissions.has(permission)) {
      throw new RoleMissingPermissionException(permission);
    }

    this.permissions.delete(permission);
    this.touch();
  }

  public hasPermission(resource: Resource, action: string): boolean {
    if (this.isDeleted()) {
      return false;
    }

    if (this.isSuperAdmin) {
      return true;
    }

    for (const permission of this.permissions) {
      if (permissionMatches(permission, resource, action)) {
        return true;
      }
    }

    return false;
  }

  public promoteToSuperAdmin(): void {
    this.assertActive();
    this.isSuperAdmin = true;
    this.touch();
  }

  public demoteFromSuperAdmin(): void {
    this.assertActive();
    this.isSuperAdmin = false;
    this.touch();
  }

  public softDelete(): void {
    if (this.isDeleted()) {
      throw new RoleAlreadyDisabledException();
    }

    if (this.isSuperAdmin) {
      throw new SuperAdminRoleCannotBeDisabledException();
    }

    this.deletedAt = new Date();
    this.touch();
  }

  public restore(): void {
    if (!this.isDeleted()) {
      throw new RoleNotDisabledException();
    }

    this.deletedAt = null;
    this.touch();
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getName(): string {
    return this.name;
  }

  public getPermissions(): PermissionKey[] {
    return [...this.permissions];
  }

  public getIsSuperAdmin(): boolean {
    return this.isSuperAdmin;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  private assertActive(): void {
    if (this.isDeleted()) {
      throw new RoleDisabledException();
    }
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  private static normalizeName(raw: string): string {
    const name = raw?.trim();

    if (!name) {
      throw new RoleNameRequiredException();
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new RoleNameTooLongException(MAX_NAME_LENGTH);
    }

    return name;
  }

  private static assertValidPermissions(permissions: PermissionKey[]): void {
    permissions.forEach((permission) => Role.assertValidPermission(permission));
  }

  private static assertValidPermission(
    permission: string,
  ): asserts permission is PermissionKey {
    if (!isPermissionKey(permission)) {
      throw new InvalidPermissionException(permission);
    }
  }

  private static assertNoDuplicatePermissions(
    permissions: PermissionKey[],
  ): void {
    if (new Set(permissions).size !== permissions.length) {
      throw new DuplicatePermissionsException();
    }
  }
}
