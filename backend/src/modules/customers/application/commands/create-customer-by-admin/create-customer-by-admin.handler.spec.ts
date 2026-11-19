import { describe, expect, it, jest } from '@jest/globals';
import { CreateCustomerByAdminHandler } from './create-customer-by-admin.handler';
import { CreateCustomerByAdminCommand } from './create-customer-by-admin.command';
import { Customer } from '../../../domain/customer.aggregate';
import { CustomerGender } from '../../../domain/enums/customer-gender.enum';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { USER_CREATED_EVENT } from '../../../../users/domain/events/user-created.event';
import { ACCOUNT_SIGNED_UP_EVENT } from '../../../../authentication/domain/events/account-signed-up.event';
import { Account } from '../../../../authentication/domain/account.aggregate';
import { CUSTOMER_CREATED_EVENT } from '../../../domain/events/customer-created.event';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user' as const,
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const profile = {
  gender: CustomerGender.MALE,
  dateOfBirth: new Date('1995-01-01T00:00:00.000Z'),
  phones: [{ phone: '0901234567', isPrimary: true }],
  addresses: [{ address: '12 Nguyễn Huệ', isDefault: true }],
};

const command = () =>
  new CreateCustomerByAdminCommand(
    'Nguyễn',
    'Văn A',
    'khach@example.invalid',
    'MatKhau@123',
    profile,
    headers,
  );

const setup = () => {
  const user = {
    getId: () => 'user-id',
    getFirstName: () => 'Nguyễn',
    getLastName: () => 'Văn A',
    getEmail: () => 'khach@example.invalid',
    getRoleIds: () => [],
  };
  const createUser = jest.fn(() => Promise.resolve(user));
  const accountCreate = jest
    .fn<(account: Account) => Promise<void>>()
    .mockResolvedValue(undefined);
  const customerCreate = jest.fn<(customer: Customer) => Promise<Customer>>(
    (customer) => Promise.resolve(customer),
  );
  const outboxCreate = jest
    .fn<
      (event: {
        eventType: string;
        payload: { audit: { entityType: EntityType; entityId: string } };
      }) => Promise<void>
    >()
    .mockResolvedValue(undefined);
  const run = jest.fn(async (work: () => Promise<unknown>) => work());

  const handler = new CreateCustomerByAdminHandler(
    { create: createUser } as never,
    { create: accountCreate } as never,
    { create: customerCreate } as never,
    { create: outboxCreate } as never,
    { run } as unknown as IUnitOfWork,
  );

  return {
    handler,
    accountCreate,
    customerCreate,
    outboxCreate,
    run,
  };
};

describe('CreateCustomerByAdminHandler', () => {
  it('creates user, account and customer in one transaction', async () => {
    const { handler, accountCreate, customerCreate, outboxCreate, run } =
      setup();

    const result = await handler.execute(command());

    expect(run).toHaveBeenCalledTimes(1);
    expect(customerCreate).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(customerCreate.mock.calls[0][0].getId());

    const account = accountCreate.mock.calls[0][0];

    expect(account.getUserId()).toBe('user-id');
    expect(account.getMustChangePassword()).toBe(true);

    const customer = customerCreate.mock.calls[0][0];

    expect(customer.getUserId()).toBe('user-id');
    expect(customer.getPhones()[0].getPhone()).toBe('0901234567');
    expect(customer.getAddresses()[0].getAddress()).toBe('12 Nguyễn Huệ');

    expect(outboxCreate.mock.calls.map((call) => call[0].eventType)).toEqual([
      USER_CREATED_EVENT,
      ACCOUNT_SIGNED_UP_EVENT,
      CUSTOMER_CREATED_EVENT,
    ]);
    expect(outboxCreate.mock.calls[2][0].payload.audit.entityType).toBe(
      EntityType.CUSTOMERS,
    );
  });
});
