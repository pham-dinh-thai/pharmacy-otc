import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { BatchStatus } from '../../../domain/batch/batch-status.enum';
import { Batch } from '../../../domain/batch/batch.entity';
import {
  InsufficientStockException,
  InvalidStockQuantityException,
  InventoryNotFoundException,
} from '../../../domain/exceptions/inventory.exceptions';
import type {
  FindInventoryOptions,
  IInventoriesRepository,
} from '../../../domain/inventories.repository';
import { Inventory } from '../../../domain/inventory.aggregate';
import { IssueStockCommand } from './issue-stock.command';
import { IssueStockHandler } from './issue-stock.handler';

const PRODUCT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const CREATED_BY = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const EARLY_ID = '11111111-1111-4111-8111-111111111111';
const LATER_ID = '22222222-2222-4222-8222-222222222222';
const EXPIRED_ID = '33333333-3333-4333-8333-333333333333';
const OUT_ID = '44444444-4444-4444-8444-444444444444';
const ZERO_ID = '55555555-5555-4555-8555-555555555555';

const EARLY_EXPIRES_AT = new Date('2027-01-01T00:00:00.000Z');
const LATER_EXPIRES_AT = new Date('2028-01-01T00:00:00.000Z');
const PAST_EXPIRES_AT = new Date('2020-01-01T00:00:00.000Z');
const OUT_EXPIRES_AT = new Date('2029-01-01T00:00:00.000Z');
const ZERO_EXPIRES_AT = new Date('2030-01-01T00:00:00.000Z');

const headers = { ...systemActorHeaders(), actorId: CREATED_BY };

type FindByProductId = (
  productId: string,
  options?: FindInventoryOptions,
) => Promise<Inventory | null>;

type Save = (inventory: Inventory) => Promise<Inventory>;

type Run = (work: () => Promise<unknown>) => Promise<unknown>;

const batch = (
  id: string,
  quantity: number,
  expiresAt: Date,
  status = BatchStatus.ACTIVE,
): Batch =>
  Batch.create({
    id,
    lotNumber: `LOT-${id.slice(0, 3)}`,
    productId: PRODUCT_ID,
    quantity,
    unitCost: '2500',
    status,
    expiresAt,
    createdBy: CREATED_BY,
  });

const createInventory = (): Inventory =>
  Inventory.fromPersistent(PRODUCT_ID, [
    batch(LATER_ID, 5, LATER_EXPIRES_AT),
    batch(EXPIRED_ID, 10, PAST_EXPIRES_AT),
    batch(ZERO_ID, 0, ZERO_EXPIRES_AT),
    batch(EARLY_ID, 5, EARLY_EXPIRES_AT),
    batch(OUT_ID, 10, OUT_EXPIRES_AT, BatchStatus.OUT),
  ]);

const setup = (inventory: Inventory | null) => {
  const findByProductId = jest.fn<FindByProductId>(() =>
    Promise.resolve(inventory),
  );
  const save = jest.fn<Save>((value) => Promise.resolve(value));
  const run = jest.fn<Run>((work) => work());
  const execute = jest.fn<CommandBus['execute']>(() =>
    Promise.resolve({ id: 'audit-id' }),
  );

  const repository = {
    findByProductId,
    findBatchesPage: jest.fn<IInventoriesRepository['findBatchesPage']>(),
    findBatchById: jest.fn<IInventoriesRepository['findBatchById']>(),
    findInventorySummaryPage:
      jest.fn<IInventoriesRepository['findInventorySummaryPage']>(),
    save,
  } as unknown as IInventoriesRepository;

  const unitOfWork = { run } as unknown as IUnitOfWork;
  const handler = new IssueStockHandler(
    repository,
    { execute } as unknown as CommandBus,
    unitOfWork,
  );

  return { handler, findByProductId, save, run, execute };
};

describe('IssueStockHandler', () => {
  it('issues FEFO across usable batches and records one audit log per batch', async () => {
    const inventory = createInventory();
    const { handler, findByProductId, save, run, execute } = setup(inventory);

    const result = await handler.execute(
      new IssueStockCommand(PRODUCT_ID, 7, headers),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.invocationCallOrder[0]).toBeLessThan(
      findByProductId.mock.invocationCallOrder[0],
    );
    expect(findByProductId).toHaveBeenCalledWith(PRODUCT_ID, {
      forUpdate: true,
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(inventory);

    expect(result).toEqual({
      productId: PRODUCT_ID,
      issued: [
        { batchId: EARLY_ID, quantity: 5 },
        { batchId: LATER_ID, quantity: 2 },
      ],
    });

    const quantities = new Map(
      inventory.getBatches().map((item) => [item.getId(), item.getQuantity()]),
    );
    expect(quantities.get(EARLY_ID)).toBe(0);
    expect(quantities.get(LATER_ID)).toBe(3);
    expect(quantities.get(EXPIRED_ID)).toBe(10);
    expect(quantities.get(OUT_ID)).toBe(10);
    expect(quantities.get(ZERO_ID)).toBe(0);

    expect(execute).toHaveBeenCalledTimes(2);
    const auditCommands = execute.mock.calls.map(([command]) => command);
    expect(auditCommands[0]).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommands[0] as RecordAuditLogCommand).props).toMatchObject({
      actorId: CREATED_BY,
      actorType: 'system',
      actorLabel: headers.actorLabel,
      ipAddress: headers.userIp,
      userAgent: headers.userAgent,
      status: 'success',
      action: 'issue',
      entityType: EntityType.INVENTORIES,
      entityId: PRODUCT_ID,
      before: { quantity: 5 },
      after: {
        productId: PRODUCT_ID,
        batchId: EARLY_ID,
        lotNumber: `LOT-${EARLY_ID.slice(0, 3)}`,
        quantity: 0,
        unitCost: '2500',
        status: BatchStatus.ACTIVE,
        expiresAt: EARLY_EXPIRES_AT.toISOString(),
      },
      metadata: { batchId: EARLY_ID },
    });
    expect(auditCommands[1]).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommands[1] as RecordAuditLogCommand).props).toMatchObject({
      action: 'issue',
      entityType: EntityType.INVENTORIES,
      entityId: PRODUCT_ID,
      before: { quantity: 5 },
      after: expect.objectContaining({
        batchId: LATER_ID,
        quantity: 3,
      }),
      metadata: { batchId: LATER_ID },
    });
  });

  it('rejects issuing more than available usable stock without saving', async () => {
    const inventory = createInventory();
    const { handler, save, execute } = setup(inventory);

    await expect(
      handler.execute(new IssueStockCommand(PRODUCT_ID, 11, headers)),
    ).rejects.toThrow(InsufficientStockException);

    expect(save).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    expect(
      inventory
        .getBatches()
        .find((item) => item.getId() === EARLY_ID)
        ?.getQuantity(),
    ).toBe(5);
  });

  it('throws when inventory does not exist', async () => {
    const { handler, save, execute } = setup(null);

    await expect(
      handler.execute(new IssueStockCommand(PRODUCT_ID, 1, headers)),
    ).rejects.toThrow(InventoryNotFoundException);

    expect(save).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a non-positive quantity before touching the repository', async () => {
    const { handler, findByProductId, save, execute } =
      setup(createInventory());

    await expect(
      handler.execute(new IssueStockCommand(PRODUCT_ID, 0, headers)),
    ).rejects.toThrow(InvalidStockQuantityException);

    expect(findByProductId).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
