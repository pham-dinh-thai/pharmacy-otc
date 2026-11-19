import { describe, expect, it, jest } from '@jest/globals';
import { RestoreCustomerHandler } from './restore-customer.handler';
import { RestoreCustomerCommand } from './restore-customer.command';
import { Customer } from '../../../domain/customer.aggregate';
import {
  CustomerNotDeletedException,
  CustomerNotFoundException,
} from '../../../domain/exceptions/customer.exceptions';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { CUSTOMER_RESTORED_EVENT } from '../../../domain/events/customer-restored.event';

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
  const outboxCreate = jest
    .fn<(event: { eventType: string }) => Promise<void>>()
    .mockResolvedValue(undefined);
  const run = jest.fn(async (work: () => Promise<unknown>) => work());
  const handler = new RestoreCustomerHandler(
    repository as never,
    { create: outboxCreate } as never,
    { run } as unknown as IUnitOfWork,
  );

  return { handler, repository, outboxCreate };
};

describe('RestoreCustomerHandler', () => {
  it('restores a deleted customer', async () => {
    const { handler, repository, outboxCreate } = setup();

    const result = await handler.execute(
      new RestoreCustomerCommand('customer-id', headers),
    );

    const customer = repository.update.mock.calls[0][0];

    expect(customer.isDeleted()).toBe(false);
    expect(result.id).toBe(customer.getId());
    expect(outboxCreate.mock.calls[0][0].eventType).toBe(
      CUSTOMER_RESTORED_EVENT,
    );
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

    expect(missing.outboxCreate).not.toHaveBeenCalled();
    expect(active.outboxCreate).not.toHaveBeenCalled();
  });
});
