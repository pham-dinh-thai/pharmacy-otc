import { describe, expect, it, jest } from '@jest/globals';
import { RegisterHandler } from './register.handler';
import { RegisterCommand } from './register.command';
import { CustomerGender } from '../../../../customers/domain/enums/customer-gender.enum';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { ACCOUNT_SIGNED_UP_EVENT } from '../../../domain/events/account-signed-up.event';
import { CUSTOMER_CREATED_EVENT } from '../../../../customers/domain/events/customer-created.event';
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
  const outboxCreate = jest
    .fn<
      (event: {
        eventType: string;
        payload: { audit: { entityType: EntityType } };
      }) => Promise<void>
    >()
    .mockResolvedValue(undefined);
  const run = jest.fn(async (work: () => Promise<unknown>) => work());

  const handler = new RegisterHandler(
    { create: accountCreate } as never,
    { execute: createUser },
    { execute: createCustomer },
    { create: outboxCreate } as never,
    { run } as unknown as IUnitOfWork,
  );

  return { handler, createUser, createCustomer, outboxCreate, accountCreate };
};

describe('RegisterHandler', () => {
  it('passes the full customer profile to the customer port', async () => {
    const { handler, createUser, createCustomer, outboxCreate, accountCreate } =
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
    expect(outboxCreate.mock.calls.map((call) => call[0].eventType)).toEqual([
      ACCOUNT_SIGNED_UP_EVENT,
      CUSTOMER_CREATED_EVENT,
    ]);
    expect(outboxCreate.mock.calls[1][0].payload.audit.entityType).toBe(
      EntityType.CUSTOMERS,
    );
  });
});
