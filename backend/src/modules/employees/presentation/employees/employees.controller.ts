import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';

@Controller('employees')
@UseGuards(AuthGuard, PermissionsGuard)
export class EmployeesController {}
