import { describe, expect, it, jest } from '@jest/globals';
import { RegisterHandler } from './register.handler';
import { RegisterCommand } from './register.command';
import { CustomerGender } from '../../../../customers/domain/enums/customer-gender.enum';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const profile = {
  gender: CustomerGender.OTHER,
  dateOfBirth: new Date('2001-09-09T00:00:00.000Z'),
  phones: [{ phone: '0901234567', isPrimary: true }],
  addresses: [{ address: '12 Nguyễn Huệ', isDefault: true }],
};

const setup = () => {
  const accountCreate = jest
    .fn<(account: unknown) => void>()
    .mockImplementation(() => undefined);
  const createUser = jest
    .fn<(request: unknown) => Promise<{ id: string }>>()
    .mockResolvedValue({ id: 'user-id' });
  const createCustomer = jest
    .fn<(request: unknown) => Promise<{ id: string }>>()
    .mockResolvedValue({ id: 'customer-id' });
  const execute = jest
    .fn<(command: unknown) => Promise<unknown>>()
    .mockResolvedValue({ id: 'audit-id' });
  const run = jest.fn(async (work: () => Promise<unknown>) => work());

  const handler = new RegisterHandler(
    { create: accountCreate } as never,
    { execute: createUser },
    { execute: createCustomer },
    { run } as unknown as IUnitOfWork,
    { execute } as never,
  );

  return { handler, createUser, createCustomer, execute, accountCreate };
};

describe('RegisterHandler', () => {
  it('passes the full customer profile to the customer port', async () => {
    const { handler, createUser, createCustomer, execute, accountCreate } =
      setup();

    await handler.execute(
      new RegisterCommand(
        'Nguyễn',
        'Văn A',
        'khach@example.invalid',
        'MatKhau@123',
        profile,
        '127.0.0.1',
        'jest',
      ),
    );

    expect(createUser).toHaveBeenCalledWith({
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      email: 'khach@example.invalid',
    });
    expect(createCustomer).toHaveBeenCalledWith({
      userId: 'user-id',
      ...profile,
    });
    expect(accountCreate).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(2);

    const accountId = (
      accountCreate.mock.calls[0][0] as { getId: () => string }
    ).getId();
    const [accountAudit, customerAudit] = execute.mock.calls.map(
      ([command]) => command,
    );

    expect(accountAudit).toBeInstanceOf(RecordAuditLogCommand);
    expect((accountAudit as RecordAuditLogCommand).props).toMatchObject({
      actorId: 'user-id',
      actorType: 'user',
      actorLabel: 'khach@example.invalid',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      action: 'sign_up',
      entityType: EntityType.ACCOUNTS,
      entityId: accountId,
      after: {
        accountId,
        userId: 'user-id',
      },
    });

    expect(customerAudit).toBeInstanceOf(RecordAuditLogCommand);
    expect((customerAudit as RecordAuditLogCommand).props).toMatchObject({
      actorId: 'user-id',
      actorType: 'user',
      actorLabel: 'khach@example.invalid',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      action: 'create',
      entityType: EntityType.CUSTOMERS,
      entityId: 'customer-id',
      after: {
        userId: 'user-id',
      },
    });
  });
});
