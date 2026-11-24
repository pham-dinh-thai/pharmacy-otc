import {
  Body,
  Controller,
  Delete,
  Get,
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
import type { ActorHeaders } from '../../../../shared/types/actor-headers';
import { CustomerProfileInput } from '../../domain/customer.aggregate';
import { CustomerDetailReadModel } from '../../application/queries/customer-detail.read-model';
import { CustomerPageReadModel } from '../../application/queries/customer-page.read-model';
import { DeliveryContactReadModel } from '../../application/queries/delivery-contact.read-model';
import { CreateCustomerByAdminCommand } from '../../application/commands/create-customer-by-admin/create-customer-by-admin.command';
import { UpdateCustomerCommand } from '../../application/commands/update-customer/update-customer.command';
import { DeleteCustomerCommand } from '../../application/commands/delete-customer/delete-customer.command';
import { RestoreCustomerCommand } from '../../application/commands/restore-customer/restore-customer.command';
import { GetCustomerQuery } from '../../application/queries/get-customer/get-customer.query';
import { GetCustomersQuery } from '../../application/queries/get-customers/get-customers.query';
import { GetMyDeliveryContactQuery } from '../../application/queries/get-my-delivery-contact/get-my-delivery-contact.query';
import { SaveCustomerDeliveryContactCommand } from '../../application/commands/save-customer-delivery-contact/save-customer-delivery-contact.command';
import { CreateCustomerRequest } from './requests/create-customer.request';
import { UpdateCustomerRequest } from './requests/update-customer.request';
import { ListCustomersRequest } from './requests/list-customers.request';
import { SaveCustomerDeliveryContactRequest } from './requests/save-customer-delivery-contact.request';

@Controller('customers')
@UseGuards(AuthGuard, PermissionsGuard)
export class CustomersController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(['customers:read'])
  public findAll(
    @Query() request: ListCustomersRequest,
  ): Promise<CustomerPageReadModel> {
    return this.queryBus.execute(
      new GetCustomersQuery({
        page: request.page,
        limit: request.limit,
        search: request.search,
        deleted: request.deleted,
      }),
    );
  }

  // Static routes phải đứng trước @Get(':id') để ParseUUIDPipe không chặn.
  @Get('me/delivery-contact')
  public getMyDeliveryContact(
    @ActorContext() headers: ActorHeaders,
  ): Promise<DeliveryContactReadModel> {
    return this.queryBus.execute(
      new GetMyDeliveryContactQuery(headers.actorId),
    );
  }

  @Patch('me/delivery-contact')
  public saveMyDeliveryContact(
    @Body() request: SaveCustomerDeliveryContactRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new SaveCustomerDeliveryContactCommand(
        headers.actorId,
        request.phone ?? null,
        request.address ?? null,
        headers,
      ),
    );
  }

  @Get(':id')
  @RequirePermissions(['customers:read'])
  public findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CustomerDetailReadModel> {
    return this.queryBus.execute(new GetCustomerQuery(id));
  }

  @Post()
  @RequirePermissions(['customers:create'])
  public create(
    @Body() request: CreateCustomerRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateCustomerByAdminCommand(
        request.firstName,
        request.lastName,
        request.email,
        request.password,
        CustomersController.toProfile(request),
        headers,
      ),
    );
  }

  @Patch(':id')
  @RequirePermissions(['customers:update'])
  public update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateCustomerRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new UpdateCustomerCommand(
        id,
        request.firstName,
        request.lastName,
        request.email,
        CustomersController.toProfile(request),
        headers,
      ),
    );
  }

  @Delete(':id')
  @RequirePermissions(['customers:delete'])
  public delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(new DeleteCustomerCommand(id, headers));
  }

  @Patch(':id/restore')
  @RequirePermissions(['customers:delete'])
  public restore(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(new RestoreCustomerCommand(id, headers));
  }

  private static toProfile(request: {
    gender?: CustomerProfileInput['gender'];
    dateOfBirth?: string | null;
    phones: { phone: string; isPrimary?: boolean }[];
    addresses: { address: string; isDefault?: boolean }[];
  }): CustomerProfileInput {
    return {
      gender: request.gender ?? null,
      dateOfBirth: request.dateOfBirth
        ? new Date(`${request.dateOfBirth}T00:00:00.000Z`)
        : null,
      phones: request.phones,
      addresses: request.addresses,
    };
  }
}
