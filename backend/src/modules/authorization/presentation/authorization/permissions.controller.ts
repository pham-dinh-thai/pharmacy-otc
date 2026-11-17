import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';
import {
  MANAGE_ACTION,
  PERMISSIONS,
} from '../../domain/permission/permission-catalog';
import {
  PermissionCatalogResource,
  PermissionCatalogResponse,
} from './responses/permission-catalog.response';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  @Get()
  @RequirePermissions(['roles:read'])
  public findAll(): PermissionCatalogResponse {
    return new PermissionCatalogResponse(
      Object.entries(PERMISSIONS).map(
        ([resource, actions]) =>
          new PermissionCatalogResource(resource, [...actions, MANAGE_ACTION]),
      ),
    );
  }
}
