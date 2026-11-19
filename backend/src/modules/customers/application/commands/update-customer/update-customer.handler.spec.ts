import { describe, expect, it, jest } from '@jest/globals';
import { UpdateCustomerHandler } from './update-customer.handler';
import { UpdateCustomerCommand } from './update-customer.command';
import { Customer } from '../../../domain/customer.aggregate';
import { CustomerGender } from '../../../domain/enums/customer-gender.enum';
import { User } from '../../../../users/domain/user.aggregate';
import { CustomerAlreadyDeletedException } from '../../../domain/exceptions/customer.exceptions';
import { UserEmailAlreadyExistsException } from '../../../../users/domain/exceptions/user.exceptions';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CUSTOMER_UPDATED_EVENT } from '../../../domain/events/customer-updated.event';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user' as const,
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const profile = () => ({
  gender: CustomerGender.FEMALE,
  dateOfBirth: new Date('2000-02-02T00:00:00.000Z'),
  phones: [{ phone: '0901234567', isPrimary: true }],
  addresses: [{ address: '12 Nguyễn Huệ', isDefault: true }],
});

const makeCustomer = () => Customer.create({ userId: 'user-id', ...profile() });

const makeUser = () =>
  User.create({
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    email: 'khach@example.invalid',
  });

const command = () =>
  new UpdateCustomerCommand(
    'customer-id',
    'Trần',
    'Thị B',
    'khach-moi@example.invalid',
    profile(),
    headers,
  );

const setup = (customer: Customer | null = makeCustomer()) => {
  const usersRepository = {
    findById: jest
      .fn<() => Promise<User>>()
      .mockImplementation(() => Promise.resolve(makeUser())),
    existsByEmail: jest.fn<() => Promise<boolean>>().mockResolvedValue(false),
    update: jest
      .fn<(user: User) => Promise<void>>()
      .mockResolvedValue(undefined),
  };
  const customersRepository = {
    findByIdIncludingDeleted: jest
      .fn<() => Promise<Customer | null>>()
      .mockResolvedValue(customer),
    update: jest.fn<(value: Customer) => Promise<Customer>>((value) =>
      Promise.resolve(value),
    ),
  };
  const outboxCreate = jest
    .fn<
      (event: {
        eventType: string;
        payload: { audit: Record<string, unknown> };
      }) => Promise<void>
    >()
    .mockResolvedValue(undefined);
  const run = jest.fn(async (work: () => Promise<unknown>) => work());

  const handler = new UpdateCustomerHandler(
    customersRepository as never,
    usersRepository as never,
    { create: outboxCreate } as never,
    { run } as unknown as IUnitOfWork,
  );

  return {
    handler,
    customersRepository,
    usersRepository,
    outboxCreate,
    run,
  };
};

describe('UpdateCustomerHandler', () => {
  it('updates user and customer inside a unit of work and writes an audit event', async () => {
    const { handler, usersRepository, customersRepository, outboxCreate, run } =
      setup();

    const result = await handler.execute(command());

    expect(run).toHaveBeenCalledTimes(1);
    expect(usersRepository.update).toHaveBeenCalledTimes(1);
    expect(customersRepository.update).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(customersRepository.update.mock.calls[0][0].getId());

    const user = usersRepository.update.mock.calls[0][0];

    expect(user.getFirstName()).toBe('Trần');
    expect(user.getEmail()).toBe('khach-moi@example.invalid');

    expect(outboxCreate).toHaveBeenCalledTimes(1);
    expect(outboxCreate.mock.calls[0][0].eventType).toBe(
      CUSTOMER_UPDATED_EVENT,
    );
    expect(outboxCreate.mock.calls[0][0].payload.audit).toMatchObject({
      entityType: EntityType.CUSTOMERS,
      entityId: result.id,
      before: { firstName: 'Nguyễn' },
      after: { firstName: 'Trần' },
    });
  });

  it('refuses to update a deleted customer', async () => {
    const customer = makeCustomer();
    customer.softDelete();
    const { handler, usersRepository, outboxCreate } = setup(customer);

    await expect(handler.execute(command())).rejects.toThrow(
      CustomerAlreadyDeletedException,
    );

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });

  it('refuses an email already owned by another user', async () => {
    const { handler, usersRepository, outboxCreate } = setup();
    usersRepository.existsByEmail.mockResolvedValue(true);

    await expect(handler.execute(command())).rejects.toThrow(
      UserEmailAlreadyExistsException,
    );

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });
});
