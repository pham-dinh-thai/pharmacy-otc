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
import { CreateDepartmentCommand } from '../../application/commands/create-department/create-department.command';
import { UpdateDepartmentCommand } from '../../application/commands/update-department/update-department.command';
import { UpdateDepartmentResponse } from '../../application/commands/update-department/update-department.response';
import { SoftDeleteDepartmentCommand } from '../../application/commands/soft-delete-department/soft-delete-department.command';
import { RestoreDepartmentCommand } from '../../application/commands/restore-department/restore-department.command';
import { GetDepartmentsQuery } from '../../application/queries/get-departments/get-departments.query';
import { DepartmentListItemReadModel } from '../../application/queries/get-departments/department-list-item.read-model';
import { DepartmentPageReadModel } from '../../application/queries/get-departments/department-page.read-model';
import { GetDepartmentQuery } from '../../application/queries/get-department/get-department.query';
import { CreateDepartmentRequest } from './requests/create-department.request';
import { UpdateDepartmentRequest } from './requests/update-department.request';
import { ListDepartmentsRequest } from './requests/list-departments.request';

@Controller('departments')
@UseGuards(AuthGuard, PermissionsGuard)
export class DepartmentsController {
  private readonly logger = new Logger(DepartmentsController.name);

  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(['departments:read'])
  public findAll(
    @Query() request: ListDepartmentsRequest,
  ): Promise<DepartmentPageReadModel> {
    return this.queryBus.execute(
      new GetDepartmentsQuery({
        page: request.page,
        limit: request.limit,
        search: request.search,
        deleted: request.deleted,
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(['departments:read'])
  public findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<DepartmentListItemReadModel> {
    return this.queryBus.execute(new GetDepartmentQuery(id));
  }

  @Post()
  @RequirePermissions(['departments:create'])
  public create(
    @Body() request: CreateDepartmentRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new CreateDepartmentCommand(request.name, headers),
    );

    this.logger.log('Department created');

    return response;
  }

  @Patch(':id')
  @RequirePermissions(['departments:update'])
  public update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateDepartmentRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<UpdateDepartmentResponse> {
    const response = this.commandBus.execute(
      new UpdateDepartmentCommand(id, request.name, headers),
    );

    this.logger.log(`Department ${id} updated`);

    return response;
  }

  @Delete(':id')
  @RequirePermissions(['departments:delete'])
  public softDelete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new SoftDeleteDepartmentCommand(id, headers),
    );

    this.logger.log(`Department ${id} disabled`);

    return response;
  }

  @Patch(':id/restore')
  @RequirePermissions(['departments:delete'])
  public restore(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new RestoreDepartmentCommand(id, headers),
    );

    this.logger.log(`Department ${id} restored`);

    return response;
  }
}
