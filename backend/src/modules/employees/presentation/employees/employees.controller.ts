import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum';
import { EmployeeReadModel } from '../../application/queries/employee.read-model';
import { EmployeePageReadModel } from '../../application/queries/get-employees/employee-page.read-model';
import { EmployeeDepartmentOptionReadModel } from '../../application/queries/get-employee-departments/employee-department-option.read-model';
import { GetEmployeesQuery } from '../../application/queries/get-employees/get-employees.query';
import { GetEmployeeQuery } from '../../application/queries/get-employee/get-employee.query';
import { GetEmployeeDepartmentsQuery } from '../../application/queries/get-employee-departments/get-employee-departments.query';
import { CreateEmployeeCommand } from '../../application/commands/create-employee/create-employee.command';
import { UpdateEmployeeCommand } from '../../application/commands/update-employee/update-employee.command';
import { UpdateEmployeeResponse } from '../../application/commands/update-employee/update-employee.response';
import { UpdateEmployeeStatusCommand } from '../../application/commands/update-employee-status/update-employee-status.command';
import { CreateEmployeeRequest } from './requests/create-employee.request';
import { UpdateEmployeeRequest } from './requests/update-employee.request';
import { UpdateEmployeeStatusRequest } from './requests/update-employee-status.request';
import { ListEmployeesRequest } from './requests/list-employees.request';

@Controller('employees')
@UseGuards(AuthGuard, PermissionsGuard)
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('departments')
  @RequirePermissions(['employees:read', 'employees:create'])
  public findDepartments(): Promise<EmployeeDepartmentOptionReadModel[]> {
    return this.queryBus.execute(new GetEmployeeDepartmentsQuery());
  }

  @Get()
  @RequirePermissions(['employees:read'])
  public findAll(
    @Query() request: ListEmployeesRequest,
  ): Promise<EmployeePageReadModel> {
    return this.queryBus.execute(
      new GetEmployeesQuery(request.page, request.limit),
    );
  }

  @Get(':id')
  @RequirePermissions(['employees:read'])
  public findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<EmployeeReadModel> {
    return this.queryBus.execute(new GetEmployeeQuery(id));
  }

  @Post()
  @RequirePermissions(['employees:create'])
  public create(
    @Body() request: CreateEmployeeRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new CreateEmployeeCommand(
        request.firstName,
        request.lastName,
        request.email,
        request.password,
        request.departmentId,
        request.position ?? null,
        headers,
      ),
    );

    this.logger.log('Employee created');

    return response;
  }

  @Patch(':id')
  @RequirePermissions(['employees:update'])
  public update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateEmployeeRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<UpdateEmployeeResponse> {
    const response = this.commandBus.execute(
      new UpdateEmployeeCommand(
        id,
        request.departmentId,
        request.position,
        request.status,
        headers,
      ),
    );

    this.logger.log(`Employee ${id} updated`);

    return response;
  }

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

  @Delete(':id')
  @RequirePermissions(['employees:delete'])
  public resign(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string; status: EmployeeStatus }> {
    const response = this.commandBus.execute(
      new UpdateEmployeeStatusCommand(id, EmployeeStatus.RESIGNED, headers),
    );

    this.logger.log(`Employee ${id} resigned`);

    return response;
  }
}
