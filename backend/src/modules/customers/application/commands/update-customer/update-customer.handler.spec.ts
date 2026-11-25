import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateCustomerHandler } from './update-customer.handler';
import { UpdateCustomerCommand } from './update-customer.command';
import { Customer } from '../../../domain/customer.aggregate';
import { CustomerGender } from '../../../domain/enums/customer-gender.enum';
import { User } from '../../../../users/domain/user.aggregate';
import { CustomerAlreadyDeletedException } from '../../../domain/exceptions/customer.exceptions';
import { UserEmailAlreadyExistsException } from '../../../../users/domain/exceptions/user.exceptions';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

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
  const execute = jest.fn<CommandBus['execute']>().mockResolvedValue({
    id: 'audit-id',
  });
  const run = jest.fn(async (work: () => Promise<unknown>) => work());

  const handler = new UpdateCustomerHandler(
    customersRepository as never,
    usersRepository as never,
    { execute } as unknown as CommandBus,
    { run } as unknown as IUnitOfWork,
  );

  return {
    handler,
    customersRepository,
    usersRepository,
    execute,
    run,
  };
};

describe('UpdateCustomerHandler', () => {
  it('updates user and customer inside a unit of work and writes an audit event', async () => {
    const { handler, usersRepository, customersRepository, execute, run } =
      setup();

    const result = await handler.execute(command());

    expect(run).toHaveBeenCalledTimes(1);
    expect(usersRepository.update).toHaveBeenCalledTimes(1);
    expect(customersRepository.update).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(customersRepository.update.mock.calls[0][0].getId());

    const user = usersRepository.update.mock.calls[0][0];

    expect(user.getFirstName()).toBe('Trần');
    expect(user.getEmail()).toBe('khach-moi@example.invalid');

    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      action: 'update',
      entityType: EntityType.CUSTOMERS,
      entityId: result.id,
      before: { firstName: 'Nguyễn' },
      after: { firstName: 'Trần' },
    });
  });

  it('refuses to update a deleted customer', async () => {
    const customer = makeCustomer();
    customer.softDelete();
    const { handler, usersRepository, execute } = setup(customer);

    await expect(handler.execute(command())).rejects.toThrow(
      CustomerAlreadyDeletedException,
    );

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('refuses an email already owned by another user', async () => {
    const { handler, usersRepository, execute } = setup();
    usersRepository.existsByEmail.mockResolvedValue(true);

    await expect(handler.execute(command())).rejects.toThrow(
      UserEmailAlreadyExistsException,
    );

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
