import 'reflect-metadata';
import { jest } from '@jest/globals';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { ListCustomersRequest } from './requests/list-customers.request';
import { CreateCustomerRequest } from './requests/create-customer.request';
import { UpdateCustomerRequest } from './requests/update-customer.request';
import { GetCustomersQuery } from '../../application/queries/get-customers/get-customers.query';
import { GetCustomerQuery } from '../../application/queries/get-customer/get-customer.query';
import { GetMyDeliveryContactQuery } from '../../application/queries/get-my-delivery-contact/get-my-delivery-contact.query';
import { CreateCustomerByAdminCommand } from '../../application/commands/create-customer-by-admin/create-customer-by-admin.command';
import { SaveCustomerDeliveryContactCommand } from '../../application/commands/save-customer-delivery-contact/save-customer-delivery-contact.command';
import { UpdateCustomerCommand } from '../../application/commands/update-customer/update-customer.command';
import { DeleteCustomerCommand } from '../../application/commands/delete-customer/delete-customer.command';
import { RestoreCustomerCommand } from '../../application/commands/restore-customer/restore-customer.command';
import { SaveCustomerDeliveryContactRequest } from './requests/save-customer-delivery-contact.request';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { CustomerGender } from '../../domain/enums/customer-gender.enum';

const CUSTOMER_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user' as const,
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const profile = {
  gender: CustomerGender.MALE,
  dateOfBirth: '1998-04-12',
  phones: [{ phone: '0901234567', isPrimary: true }],
  addresses: [{ address: '12 Nguyễn Huệ', isDefault: true }],
};

describe('CustomersController', () => {
  let controller: CustomersController;
  let commandExecute: jest.Mock<(command: unknown) => Promise<unknown>>;
  let queryExecute: jest.Mock<(query: unknown) => Promise<unknown>>;

  beforeEach(async () => {
    commandExecute = jest.fn<(command: unknown) => Promise<unknown>>();
    queryExecute = jest.fn<(query: unknown) => Promise<unknown>>();

    const module = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        { provide: CommandBus, useValue: { execute: commandExecute } },
        { provide: QueryBus, useValue: { execute: queryExecute } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CustomersController);
  });

  it('dispatches list query with all filters', async () => {
    queryExecute.mockResolvedValue({ items: [], total: 0 });
    const request = new ListCustomersRequest();
    request.page = 2;
    request.limit = 10;
    request.search = 'nguyen';
    request.deleted = true;

    await controller.findAll(request);

    expect(queryExecute).toHaveBeenCalledWith(
      new GetCustomersQuery({
        page: 2,
        limit: 10,
        search: 'nguyen',
        deleted: true,
      }),
    );
  });

  it('dispatches detail query', async () => {
    queryExecute.mockResolvedValue(null);

    await controller.findOne(CUSTOMER_ID);

    expect(queryExecute).toHaveBeenCalledWith(
      new GetCustomerQuery(CUSTOMER_ID),
    );
  });

  it('maps create payload to a full customer profile', async () => {
    commandExecute.mockResolvedValue({ id: CUSTOMER_ID });
    const request = Object.assign(new CreateCustomerRequest(), {
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      email: 'khach@example.invalid',
      password: 'MatKhau@123',
      ...profile,
    });

    await controller.create(request, headers);

    const command = commandExecute.mock
      .calls[0][0] as CreateCustomerByAdminCommand;

    expect(command).toBeInstanceOf(CreateCustomerByAdminCommand);
    expect(command.profile).toMatchObject({
      gender: CustomerGender.MALE,
      dateOfBirth: new Date('1998-04-12T00:00:00.000Z'),
      phones: profile.phones,
      addresses: profile.addresses,
    });
    expect(command.headers).toBe(headers);
  });

  it('maps update payload including date of birth', async () => {
    commandExecute.mockResolvedValue({ id: CUSTOMER_ID });
    const request = Object.assign(new UpdateCustomerRequest(), {
      firstName: 'Trần',
      lastName: 'Thị B',
      email: 'khach-moi@example.invalid',
      ...profile,
    });

    await controller.update(CUSTOMER_ID, request, headers);

    const command = commandExecute.mock.calls[0][0] as UpdateCustomerCommand;

    expect(command).toBeInstanceOf(UpdateCustomerCommand);
    expect(command.id).toBe(CUSTOMER_ID);
    expect(command.profile.dateOfBirth).toEqual(
      new Date('1998-04-12T00:00:00.000Z'),
    );
  });

  it('reads delivery contact for the authenticated user', async () => {
    const contact = { phone: '0901234567', address: null };
    queryExecute.mockResolvedValue(contact);

    const result = await controller.getMyDeliveryContact(headers);

    expect(queryExecute).toHaveBeenCalledWith(
      new GetMyDeliveryContactQuery(headers.actorId),
    );
    expect(result).toEqual(contact);
  });

  it('saves a partial delivery contact for the authenticated user', async () => {
    commandExecute.mockResolvedValue({ id: CUSTOMER_ID });
    const request = Object.assign(new SaveCustomerDeliveryContactRequest(), {
      phone: '0901234567',
      address: null,
    });

    await controller.saveMyDeliveryContact(request, headers);

    expect(commandExecute).toHaveBeenCalledWith(
      new SaveCustomerDeliveryContactCommand(
        headers.actorId,
        '0901234567',
        null,
        headers,
      ),
    );
  });

  it('dispatches delete and restore with the same delete permission', async () => {
    commandExecute.mockResolvedValue({ id: CUSTOMER_ID });

    await controller.delete(CUSTOMER_ID, headers);
    await controller.restore(CUSTOMER_ID, headers);

    expect(commandExecute).toHaveBeenNthCalledWith(
      1,
      new DeleteCustomerCommand(CUSTOMER_ID, headers),
    );
    expect(commandExecute).toHaveBeenNthCalledWith(
      2,
      new RestoreCustomerCommand(CUSTOMER_ID, headers),
    );
  });
});
