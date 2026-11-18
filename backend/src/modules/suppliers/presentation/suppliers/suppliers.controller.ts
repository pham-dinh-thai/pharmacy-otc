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
import { CreateSupplierCommand } from '../../application/commands/create-supplier/create-supplier.command';
import { UpdateSupplierCommand } from '../../application/commands/update-supplier/update-supplier.command';
import { UpdateSupplierResponse } from '../../application/commands/update-supplier/update-supplier.response';
import { DeleteSupplierCommand } from '../../application/commands/delete-supplier/delete-supplier.command';
import { RestoreSupplierCommand } from '../../application/commands/restore-supplier/restore-supplier.command';
import { GetSupplierQuery } from '../../application/queries/get-supplier/get-supplier.query';
import { SupplierDetailReadModel } from '../../application/queries/get-supplier/supplier-detail.read-model';
import { GetSuppliersQuery } from '../../application/queries/get-suppliers/get-suppliers.query';
import { SupplierListItemReadModel } from '../../application/queries/get-suppliers/supplier-list-item.read-model';
import { CreateSupplierRequest } from './requests/create-supplier.request';
import { UpdateSupplierRequest } from './requests/update-supplier.request';
import { ListSuppliersRequest } from './requests/list-suppliers.request';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

@Controller('suppliers')
@UseGuards(AuthGuard, PermissionsGuard)
export class SuppliersController {
  private readonly logger = new Logger(SuppliersController.name);

  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(['suppliers:read'])
  public findAll(
    @Query() request: ListSuppliersRequest,
  ): Promise<SupplierListItemReadModel[]> {
    return this.queryBus.execute(
      new GetSuppliersQuery(request.deleted, request.search),
    );
  }

  @Get(':id')
  @RequirePermissions(['suppliers:read'])
  public findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<SupplierDetailReadModel> {
    return this.queryBus.execute(new GetSupplierQuery(id));
  }

  @Post()
  @RequirePermissions(['suppliers:create'])
  public create(
    @Body() request: CreateSupplierRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new CreateSupplierCommand(
        request.name,
        request.phone ?? null,
        request.email ?? null,
        request.address ?? null,
        request.taxCode ?? null,
        headers,
      ),
    );

    this.logger.log(`Supplier created`, response);

    return response;
  }

  @Patch(':id')
  @RequirePermissions(['suppliers:update'])
  public update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateSupplierRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<UpdateSupplierResponse> {
    const response = this.commandBus.execute(
      new UpdateSupplierCommand(
        id,
        request.name,
        request.phone ?? null,
        request.email ?? null,
        request.address ?? null,
        request.taxCode ?? null,
        headers,
      ),
    );

    this.logger.log(`Supplier ${id} updated`, response);

    return response;
  }

  @Delete(':id')
  @RequirePermissions(['suppliers:delete'])
  public delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new DeleteSupplierCommand(id, headers),
    );

    this.logger.log(`Supplier ${id} deleted`);

    return response;
  }

  @Patch(':id/restore')
  @RequirePermissions(['suppliers:delete'])
  public restore(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new RestoreSupplierCommand(id, headers),
    );

    this.logger.log(`Supplier ${id} restored`);

    return response;
  }
}
