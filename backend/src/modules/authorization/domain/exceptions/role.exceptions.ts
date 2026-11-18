import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class RoleNotFoundException extends DomainException {
  public constructor(id: string) {
    super(`Role id ${id} not found`, 'ROLE_NOT_FOUND');
  }
}

export class RoleDisabledException extends DomainException {
  public constructor() {
    super('Role is disabled', 'ROLE_DISABLED');
  }
}

export class RoleAlreadyDisabledException extends DomainException {
  public constructor() {
    super('Role is already disabled', 'ROLE_ALREADY_DISABLED');
  }
}

export class RoleNotDisabledException extends DomainException {
  public constructor() {
    super('Role is not disabled', 'ROLE_NOT_DISABLED');
  }
}

export class SuperAdminRoleCannotBeDisabledException extends DomainException {
  public constructor() {
    super(
      'Cannot disable a Super Admin role',
      'SUPER_ADMIN_ROLE_CANNOT_BE_DISABLED',
    );
  }
}

export class RoleAlreadyHasPermissionException extends DomainException {
  public constructor(permission: string) {
    super(
      `Role already has permission "${permission}"`,
      'ROLE_ALREADY_HAS_PERMISSION',
    );
  }
}

export class RoleMissingPermissionException extends DomainException {
  public constructor(permission: string) {
    super(
      `Role does not have permission "${permission}"`,
      'ROLE_MISSING_PERMISSION',
    );
  }
}

export class RoleNameRequiredException extends DomainException {
  public constructor() {
    super('Role name is required', 'ROLE_NAME_REQUIRED');
  }
}

export class RoleNameTooLongException extends DomainException {
  public constructor(maxLength: number) {
    super(
      `Role name must have at most ${maxLength} characters`,
      'ROLE_NAME_TOO_LONG',
    );
  }
}

export class InvalidPermissionException extends DomainException {
  public constructor(permission: string) {
    super(`Invalid permission "${permission}"`, 'INVALID_PERMISSION');
  }
}

export class DuplicatePermissionsException extends DomainException {
  public constructor() {
    super('Duplicate permissions are not allowed', 'DUPLICATE_PERMISSIONS');
  }
}

export class UnknownPermissionResourceException extends DomainException {
  public constructor(resource: string) {
    super(`Unknown resource "${resource}"`, 'UNKNOWN_PERMISSION_RESOURCE');
  }
}

export class InvalidPermissionActionException extends DomainException {
  public constructor(action: string, resource: string) {
    super(
      `Invalid action "${action}" for resource "${resource}"`,
      'INVALID_PERMISSION_ACTION',
    );
  }
}
