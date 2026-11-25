import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCustomerHandler } from './delete-customer.handler';
import { DeleteCustomerCommand } from './delete-customer.command';
import { Customer } from '../../../domain/customer.aggregate';
import { CustomerGender } from '../../../domain/enums/customer-gender.enum';
import {
  CustomerAlreadyDeletedException,
  CustomerNotFoundException,
} from '../../../domain/exceptions/customer.exceptions';
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

const makeCustomer = () =>
  Customer.create({
    userId: 'user-id',
    gender: CustomerGender.MALE,
    dateOfBirth: null,
    phones: [{ phone: '0901234567' }],
    addresses: [{ address: '12 Nguyễn Huệ' }],
  });

const setup = (customer: Customer | null = makeCustomer()) => {
  const repository = {
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
  const handler = new DeleteCustomerHandler(
    repository as never,
    { execute } as unknown as CommandBus,
    { run } as unknown as IUnitOfWork,
  );

  return { handler, repository, execute, run };
};

describe('DeleteCustomerHandler', () => {
  it('soft deletes the customer and writes a delete audit event', async () => {
    const { handler, repository, execute, run } = setup();

    const result = await handler.execute(
      new DeleteCustomerCommand('customer-id', headers),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledTimes(1);

    const customer = repository.update.mock.calls[0][0];

    expect(customer.isDeleted()).toBe(true);
    expect(result.id).toBe(customer.getId());

    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      action: 'delete',
      entityType: EntityType.CUSTOMERS,
      entityId: result.id,
      before: { deletedAt: null },
      after: { deletedAt: customer.getDeletedAt() },
    });
  });

  it('rejects a missing or already deleted customer', async () => {
    const missing = setup(null);

    await expect(
      missing.handler.execute(
        new DeleteCustomerCommand('customer-id', headers),
      ),
    ).rejects.toThrow(CustomerNotFoundException);

    const customer = makeCustomer();
    customer.softDelete();
    const deleted = setup(customer);

    await expect(
      deleted.handler.execute(
        new DeleteCustomerCommand('customer-id', headers),
      ),
    ).rejects.toThrow(CustomerAlreadyDeletedException);

    expect(missing.execute).not.toHaveBeenCalled();
    expect(deleted.execute).not.toHaveBeenCalled();
  });
});
