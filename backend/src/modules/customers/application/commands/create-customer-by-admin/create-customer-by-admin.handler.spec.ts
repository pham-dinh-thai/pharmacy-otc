import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { CreateCustomerByAdminHandler } from './create-customer-by-admin.handler';
import { CreateCustomerByAdminCommand } from './create-customer-by-admin.command';
import { Customer } from '../../../domain/customer.aggregate';
import { CustomerGender } from '../../../domain/enums/customer-gender.enum';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { Account } from '../../../../authentication/domain/account.aggregate';

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
  const execute = jest.fn<CommandBus['execute']>().mockResolvedValue({
    id: 'audit-id',
  });
  const run = jest.fn(async (work: () => Promise<unknown>) => work());

  const handler = new CreateCustomerByAdminHandler(
    { create: createUser } as never,
    { create: accountCreate } as never,
    { create: customerCreate } as never,
    { execute } as unknown as CommandBus,
    { run } as unknown as IUnitOfWork,
  );

  return {
    handler,
    accountCreate,
    customerCreate,
    execute,
    run,
  };
};

describe('CreateCustomerByAdminHandler', () => {
  it('creates user, account and customer in one transaction', async () => {
    const { handler, accountCreate, customerCreate, execute, run } = setup();

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

    const commands = execute.mock.calls.map(([issuedCommand]) => issuedCommand);

    expect(commands).toHaveLength(3);
    expect(
      commands.every(
        (issuedCommand) => issuedCommand instanceof RecordAuditLogCommand,
      ),
    ).toBe(true);

    const auditCommands = commands as RecordAuditLogCommand[];

    expect(auditCommands.map(({ props }) => props.action)).toEqual([
      'create',
      'sign_up',
      'create',
    ]);
    expect(auditCommands.map(({ props }) => props.entityType)).toEqual([
      EntityType.USERS,
      EntityType.ACCOUNTS,
      EntityType.CUSTOMERS,
    ]);
    expect(auditCommands.map(({ props }) => props.entityId)).toEqual([
      'user-id',
      account.getId(),
      customer.getId(),
    ]);
  });
});
