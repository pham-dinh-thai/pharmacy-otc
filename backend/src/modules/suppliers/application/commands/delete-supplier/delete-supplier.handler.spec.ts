import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import {
  IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from '../../../domain/suppliers.repository';
import {
  IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  SupplierAlreadyDeletedException,
  SupplierNotFoundException,
} from '../../../domain/exceptions/supplier.exceptions';
import { Supplier } from '../../../domain/supplier.aggregate';
import { SUPPLIER_DELETED_EVENT } from '../../../domain/events/supplier-deleted.event';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { DeleteSupplierCommand } from './delete-supplier.command';
import { DeleteSupplierHandler } from './delete-supplier.handler';

const SUPPLIER_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const createSupplier = (deletedAt?: Date | null): Supplier =>
  Supplier.fromPersistent({
    id: SUPPLIER_ID,
    code: 'SUP-0007',
    name: 'Công ty TNHH ABC',
    phone: '0901234567',
    email: 'contact@abc.vn',
    address: '12 Nguyễn Huệ',
    taxCode: '0312345678',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt,
  });

describe('DeleteSupplierHandler', () => {
  let handler: DeleteSupplierHandler;
  let suppliersRepository: jest.Mocked<
    Pick<ISuppliersRepository, 'findByIdIncludingDeleted' | 'update'>
  >;
  let outboxRepository: jest.Mocked<Pick<IOutboxRepository, 'create'>>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    suppliersRepository = {
      findByIdIncludingDeleted: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<ISuppliersRepository, 'findByIdIncludingDeleted' | 'update'>
    >;

    outboxRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<Pick<IOutboxRepository, 'create'>>;

    unitOfWork = {
      run: jest.fn((work: () => Promise<any>) => work()),
    } as jest.Mocked<IUnitOfWork>;

    const module = await Test.createTestingModule({
      providers: [
        DeleteSupplierHandler,
        { provide: SUPPLIERS_REPOSITORY, useValue: suppliersRepository },
        { provide: OUTBOX_REPOSITORY, useValue: outboxRepository },
        { provide: UNIT_OF_WORK, useValue: unitOfWork },
      ],
    }).compile();

    handler = module.get(DeleteSupplierHandler);
  });

  it('throws when the supplier does not exist', async () => {
    suppliersRepository.findByIdIncludingDeleted.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteSupplierCommand(SUPPLIER_ID, headers)),
    ).rejects.toThrow(SupplierNotFoundException);

    expect(suppliersRepository.update).not.toHaveBeenCalled();
    expect(outboxRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a supplier that is already deleted', async () => {
    suppliersRepository.findByIdIncludingDeleted.mockResolvedValue(
      createSupplier(new Date('2026-02-01T00:00:00Z')),
    );

    await expect(
      handler.execute(new DeleteSupplierCommand(SUPPLIER_ID, headers)),
    ).rejects.toThrow(SupplierAlreadyDeletedException);

    expect(suppliersRepository.update).not.toHaveBeenCalled();
    expect(outboxRepository.create).not.toHaveBeenCalled();
  });

  it('soft-deletes the supplier and appends an audit event', async () => {
    const supplier = createSupplier();
    suppliersRepository.findByIdIncludingDeleted.mockResolvedValue(supplier);
    suppliersRepository.update.mockImplementation((value) =>
      Promise.resolve(value),
    );

    const result = await handler.execute(
      new DeleteSupplierCommand(SUPPLIER_ID, headers),
    );

    expect(suppliersRepository.findByIdIncludingDeleted).toHaveBeenCalledWith(
      SUPPLIER_ID,
    );
    expect(supplier.isDeleted()).toBe(true);
    expect(suppliersRepository.update).toHaveBeenCalledWith(supplier);
    expect(result).toEqual({ id: SUPPLIER_ID });

    expect(outboxRepository.create).toHaveBeenCalledWith({
      eventType: SUPPLIER_DELETED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.SUPPLIERS,
          entityId: SUPPLIER_ID,
          before: { deletedAt: null },
          after: { deletedAt: expect.any(Date) as Date },
        },
      },
    });
  });
});
