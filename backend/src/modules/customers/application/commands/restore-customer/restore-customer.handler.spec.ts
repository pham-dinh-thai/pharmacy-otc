import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { RestoreCustomerHandler } from './restore-customer.handler';
import { RestoreCustomerCommand } from './restore-customer.command';
import { Customer } from '../../../domain/customer.aggregate';
import {
  CustomerNotDeletedException,
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

const makeCustomer = (deleted = true) => {
  const customer = Customer.create({
    userId: 'user-id',
    phones: [{ phone: '0901234567' }],
    addresses: [{ address: '12 Nguyễn Huệ' }],
  });
  if (deleted) customer.softDelete();
  return customer;
};

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
  const handler = new RestoreCustomerHandler(
    repository as never,
    { execute } as unknown as CommandBus,
    { run } as unknown as IUnitOfWork,
  );

  return { handler, repository, execute };
};

describe('RestoreCustomerHandler', () => {
  it('restores a deleted customer', async () => {
    const customer = makeCustomer();
    const previousDeletedAt = customer.getDeletedAt();
    const { handler, repository, execute } = setup(customer);

    const result = await handler.execute(
      new RestoreCustomerCommand('customer-id', headers),
    );

    const restoredCustomer = repository.update.mock.calls[0][0];

    expect(restoredCustomer.isDeleted()).toBe(false);
    expect(result.id).toBe(restoredCustomer.getId());

    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      action: 'restore',
      entityType: EntityType.CUSTOMERS,
      entityId: result.id,
      before: { deletedAt: previousDeletedAt },
      after: { deletedAt: null },
    });
  });

  it('rejects a missing or active customer', async () => {
    const missing = setup(null);

    await expect(
      missing.handler.execute(
        new RestoreCustomerCommand('customer-id', headers),
      ),
    ).rejects.toThrow(CustomerNotFoundException);

    const active = setup(makeCustomer(false));

    await expect(
      active.handler.execute(
        new RestoreCustomerCommand('customer-id', headers),
      ),
    ).rejects.toThrow(CustomerNotDeletedException);

    expect(missing.execute).not.toHaveBeenCalled();
    expect(active.execute).not.toHaveBeenCalled();
  });
});
