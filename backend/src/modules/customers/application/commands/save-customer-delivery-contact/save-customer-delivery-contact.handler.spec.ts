import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { Customer } from '../../../domain/customer.aggregate';
import type { ICustomersRepository } from '../../../domain/customers.repository';
import { CustomerAlreadyDeletedException } from '../../../domain/exceptions/customer.exceptions';
import { CustomerDeliveryContactRequiredException } from '../../../domain/exceptions/customer.exceptions';
import { SaveCustomerDeliveryContactCommand } from './save-customer-delivery-contact.command';
import { SaveCustomerDeliveryContactHandler } from './save-customer-delivery-contact.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';

const headers = systemActorHeaders();

const setup = (existing: Customer | null = null) => {
  const findByUserId = jest
    .fn<ICustomersRepository['findByUserId']>()
    .mockResolvedValue(existing);
  const create = jest.fn<ICustomersRepository['create']>((customer) =>
    Promise.resolve(customer),
  );
  const update = jest.fn<ICustomersRepository['update']>((customer) =>
    Promise.resolve(customer),
  );
  const execute = jest.fn<CommandBus['execute']>().mockResolvedValue({
    id: 'audit-id',
  });
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new SaveCustomerDeliveryContactHandler(
    { findByUserId, create, update } as unknown as ICustomersRepository,
    { execute } as unknown as CommandBus,
    { run } as unknown as IUnitOfWork,
  );

  const command = (phone: string | null, address: string | null) =>
    new SaveCustomerDeliveryContactCommand(USER_ID, phone, address, headers);

  return { handler, command, findByUserId, create, update, execute, run };
};

describe('SaveCustomerDeliveryContactHandler', () => {
  it('creates a customer with only a delivery phone', async () => {
    const { handler, command, create, update, execute } = setup();

    const result = await handler.execute(command('0901234567', null));

    expect(create).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalledTimes(1);

    const customer = create.mock.calls[0][0];
    expect(result.id).toBe(customer.getId());
    expect(customer.getUserId()).toBe(USER_ID);
    expect(customer.getPhones().map((item) => item.getPhone())).toEqual([
      '0901234567',
    ]);
    expect(customer.getAddresses()).toHaveLength(0);

    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      action: 'create',
      entityType: EntityType.CUSTOMERS,
      entityId: result.id,
      before: null,
      after: { phones: ['0901234567'], addresses: [] },
    });
  });

  it('updates only the supplied part and keeps other contacts', async () => {
    const existing = Customer.create({
      userId: USER_ID,
      phones: [
        { phone: '0901111111', isPrimary: true },
        { phone: '0902222222', isPrimary: false },
      ],
      addresses: [{ address: '1 Nguyen Hue', isDefault: true }],
    });
    const { handler, command, create, update, execute } = setup(existing);

    await handler.execute(command(null, '2 Le Loi'));

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(existing.getPhones().map((item) => item.getPhone())).toEqual([
      '0901111111',
      '0902222222',
    ]);
    expect(existing.getAddresses().map((item) => item.getAddress())).toEqual([
      '2 Le Loi',
    ]);
    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      action: 'update',
      entityType: EntityType.CUSTOMERS,
      entityId: existing.getId(),
      before: {
        phones: ['0901111111', '0902222222'],
        addresses: ['1 Nguyen Hue'],
      },
      after: {
        phones: ['0901111111', '0902222222'],
        addresses: ['2 Le Loi'],
      },
    });
  });

  it('rejects an empty payload', async () => {
    const { handler, command, create, update, execute } = setup();

    await expect(handler.execute(command(null, null))).rejects.toThrow(
      CustomerDeliveryContactRequiredException,
    );
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a deleted customer', async () => {
    const existing = Customer.createForDelivery({
      userId: USER_ID,
      phone: '0901234567',
    });
    existing.softDelete();
    const { handler, command, update } = setup(existing);

    await expect(handler.execute(command('0909999999', null))).rejects.toThrow(
      CustomerAlreadyDeletedException,
    );
    expect(update).not.toHaveBeenCalled();
  });
});
