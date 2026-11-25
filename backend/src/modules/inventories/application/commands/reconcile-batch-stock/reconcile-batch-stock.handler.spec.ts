import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { InvalidQuantityException } from '../../../../../shared/domain/exceptions/value-object.exceptions';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import {
  BatchNotFoundException,
  InventoryNotFoundException,
} from '../../../domain/exceptions/inventory.exceptions';
import { Batch } from '../../../domain/batch/batch.entity';
import { BatchStatus } from '../../../domain/batch/batch-status.enum';
import {
  FindInventoryOptions,
  IInventoriesRepository,
} from '../../../domain/inventories.repository';
import { Inventory } from '../../../domain/inventory.aggregate';
import { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { ReconcileBatchStockCommand } from './reconcile-batch-stock.command';
import { ReconcileBatchStockHandler } from './reconcile-batch-stock.handler';

const PRODUCT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const CREATED_BY = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const EXPIRES_AT = new Date('2030-01-01T00:00:00.000Z');

const headers = {
  actorId: CREATED_BY,
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

type FindByProductId = (
  productId: string,
  options?: FindInventoryOptions,
) => Promise<Inventory | null>;

type Save = (inventory: Inventory) => Promise<Inventory>;

type Run = (work: () => Promise<unknown>) => Promise<unknown>;

const createInventory = (quantity: number): Inventory => {
  const batch = Batch.create({
    lotNumber: 'LOT-001',
    productId: PRODUCT_ID,
    quantity,
    unitCost: '2500',
    status: BatchStatus.ACTIVE,
    expiresAt: EXPIRES_AT,
    createdBy: CREATED_BY,
  });

  return Inventory.fromPersistent(PRODUCT_ID, [batch]);
};

const setup = (inventory: Inventory | null) => {
  const findByProductId = jest.fn<FindByProductId>(() =>
    Promise.resolve(inventory),
  );
  const save = jest.fn<Save>((value) => Promise.resolve(value));
  const run = jest.fn<Run>((work) => work());
  const execute = jest.fn<CommandBus['execute']>(() =>
    Promise.resolve({ id: 'audit-id' }),
  );

  const repository: IInventoriesRepository = {
    findByProductId,
    findBatchesPage: jest.fn<IInventoriesRepository['findBatchesPage']>(),
    findBatchById: jest.fn<IInventoriesRepository['findBatchById']>(),
    findInventorySummaryPage:
      jest.fn<IInventoriesRepository['findInventorySummaryPage']>(),
    save,
  };
  const unitOfWork: IUnitOfWork = {
    run: run as unknown as IUnitOfWork['run'],
  };
  const handler = new ReconcileBatchStockHandler(
    repository,
    { execute } as unknown as CommandBus,
    unitOfWork,
  );

  return { handler, findByProductId, save, run, execute };
};

describe('ReconcileBatchStockHandler', () => {
  it('overwrites stock with counted quantity inside a unit of work', async () => {
    const inventory = createInventory(10);
    const batchId = inventory.getBatches()[0].getId();
    const { handler, findByProductId, save, run, execute } = setup(inventory);

    const result = await handler.execute(
      new ReconcileBatchStockCommand(PRODUCT_ID, batchId, 7, headers),
    );

    expect(result).toBe(7);
    expect(inventory.getBatches()[0].getQuantity()).toBe(7);
    expect(findByProductId).toHaveBeenCalledWith(PRODUCT_ID, {
      forUpdate: true,
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(inventory);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.invocationCallOrder[0]).toBeLessThan(
      findByProductId.mock.invocationCallOrder[0],
    );

    expect(execute).toHaveBeenCalledTimes(1);
    const auditCommand = execute.mock.calls[0][0];
    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: CREATED_BY,
      actorType: 'user',
      actorLabel: 'admin@example.com',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      status: 'success',
      action: 'reconcile',
      entityType: EntityType.INVENTORIES,
      entityId: PRODUCT_ID,
      before: { quantity: 10 },
      after: {
        productId: PRODUCT_ID,
        batchId,
        lotNumber: 'LOT-001',
        quantity: 7,
        unitCost: '2500',
        status: BatchStatus.ACTIVE,
        expiresAt: EXPIRES_AT.toISOString(),
      },
      metadata: { batchId },
    });
  });

  it('accepts zero as counted quantity', async () => {
    const inventory = createInventory(10);
    const batchId = inventory.getBatches()[0].getId();
    const { handler, save } = setup(inventory);

    const result = await handler.execute(
      new ReconcileBatchStockCommand(PRODUCT_ID, batchId, 0, headers),
    );

    expect(result).toBe(0);
    expect(inventory.getBatches()[0].getQuantity()).toBe(0);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when inventory does not exist', async () => {
    const { handler, save, execute } = setup(null);

    await expect(
      handler.execute(
        new ReconcileBatchStockCommand(
          PRODUCT_ID,
          'f1e2d3c4-b5a6-4978-8a9b-0c1d2e3f4a5b',
          1,
          headers,
        ),
      ),
    ).rejects.toThrow(InventoryNotFoundException);

    expect(save).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the batch does not exist', async () => {
    const inventory = createInventory(10);
    const { handler, save, execute } = setup(inventory);

    await expect(
      handler.execute(
        new ReconcileBatchStockCommand(
          PRODUCT_ID,
          'f1e2d3c4-b5a6-4978-8a9b-0c1d2e3f4a5b',
          1,
          headers,
        ),
      ),
    ).rejects.toThrow(BatchNotFoundException);

    expect(save).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects negative counted quantity and does not save', async () => {
    const inventory = createInventory(10);
    const batchId = inventory.getBatches()[0].getId();
    const { handler, save, execute } = setup(inventory);

    await expect(
      handler.execute(
        new ReconcileBatchStockCommand(PRODUCT_ID, batchId, -1, headers),
      ),
    ).rejects.toThrow(InvalidQuantityException);

    expect(inventory.getBatches()[0].getQuantity()).toBe(10);
    expect(save).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
