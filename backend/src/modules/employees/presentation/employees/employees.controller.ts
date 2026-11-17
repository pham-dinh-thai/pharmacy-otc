import {
  Body,
  Controller,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum';
import { UpdateEmployeeStatusCommand } from '../../application/commands/update-employee-status/update-employee-status.command';
import { UpdateEmployeeStatusRequest } from './requests/update-employee-status.request';

@Controller('employees')
@UseGuards(AuthGuard, PermissionsGuard)
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  public constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/status')
  @RequirePermissions(['employees:update'])
  public async updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateEmployeeStatusRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string; status: EmployeeStatus }> {
    const response = await this.commandBus.execute(
      new UpdateEmployeeStatusCommand(id, request.status, headers),
    );

    this.logger.log(`Employee ${id} status changed to ${request.status}`);

    return response;
  }
}
