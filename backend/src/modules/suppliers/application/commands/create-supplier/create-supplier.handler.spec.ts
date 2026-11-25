import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { InvalidSupplierPhoneException } from '../../../domain/exceptions/supplier.exceptions';
import {
  ISuppliersRepository,
  type FindSuppliersFilters,
  type SupplierPage,
} from '../../../domain/suppliers.repository';
import { Supplier } from '../../../domain/supplier.aggregate';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateSupplierCommand } from './create-supplier.command';
import { CreateSupplierHandler } from './create-supplier.handler';

type FindPage = (filters?: FindSuppliersFilters) => Promise<SupplierPage>;
type FindById = (id: string) => Promise<Supplier | null>;
type FindByIdIncludingDeleted = (id: string) => Promise<Supplier | null>;
type NextSequence = () => Promise<number>;
type Create = (supplier: Supplier) => Promise<Supplier>;
type Update = (supplier: Supplier) => Promise<Supplier>;
type Run = (work: () => Promise<unknown>) => Promise<unknown>;

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const createCommand = (phone: string | null = '0901234567') =>
  new CreateSupplierCommand(
    'Công ty TNHH ABC',
    phone,
    'contact@abc.vn',
    '12 Nguyễn Huệ',
    '0312345678',
    headers,
  );

const setup = (sequence = 7) => {
  const findById = jest.fn<FindById>(() => Promise.resolve(null));
  const nextSequence = jest.fn<NextSequence>(() => Promise.resolve(sequence));
  const create = jest.fn<Create>((supplier) => Promise.resolve(supplier));
  const run = jest.fn<Run>((work) => work());
  const execute = jest.fn<CommandBus['execute']>(() =>
    Promise.resolve({ id: 'audit-id' }),
  );

  const repository: ISuppliersRepository = {
    findPage: jest.fn<FindPage>(),
    findById,
    findByIdIncludingDeleted: jest.fn<FindByIdIncludingDeleted>(),
    nextSequence,
    create,
    update: jest.fn<Update>(),
  };
  const unitOfWork: IUnitOfWork = {
    run: run as unknown as IUnitOfWork['run'],
  };
  const handler = new CreateSupplierHandler(
    repository,
    { execute } as unknown as CommandBus,
    unitOfWork,
  );

  return { handler, nextSequence, create, run, execute };
};

describe('CreateSupplierHandler', () => {
  it('creates a supplier inside a unit of work and saves it', async () => {
    const { handler, nextSequence, create, run, execute } = setup(7);

    const result = await handler.execute(createCommand());

    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(nextSequence).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.invocationCallOrder[0]).toBeLessThan(
      nextSequence.mock.invocationCallOrder[0],
    );

    const created = create.mock.calls[0][0];

    expect(created.getId()).toBe(result.id);
    expect(created.getCode()).toBe('SUP-0007');
    expect(created.getName()).toBe('Công ty TNHH ABC');
    expect(created.getPhone()).toBe('0901234567');
    expect(created.getEmail()).toBe('contact@abc.vn');
    expect(created.getAddress()).toBe('12 Nguyễn Huệ');
    expect(created.getTaxCode()).toBe('0312345678');

    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];
    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      actorType: headers.actorType,
      actorLabel: headers.actorLabel,
      ipAddress: headers.userIp,
      userAgent: headers.userAgent,
      action: 'create',
      entityType: EntityType.SUPPLIERS,
      entityId: created.getId(),
      before: null,
      after: {
        code: 'SUP-0007',
        name: 'Công ty TNHH ABC',
        phone: '0901234567',
        email: 'contact@abc.vn',
        address: '12 Nguyễn Huệ',
        taxCode: '0312345678',
      },
      reason: null,
    });
  });

  it('normalizes +84 phone numbers before saving', async () => {
    const { handler, create } = setup(8);

    await handler.execute(createCommand('+84901234567'));

    expect(create.mock.calls[0][0].getPhone()).toBe('0901234567');
  });

  it('does not save when the phone is invalid', async () => {
    const { handler, create, execute } = setup();

    await expect(handler.execute(createCommand('0123456789'))).rejects.toThrow(
      InvalidSupplierPhoneException,
    );

    expect(create).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
