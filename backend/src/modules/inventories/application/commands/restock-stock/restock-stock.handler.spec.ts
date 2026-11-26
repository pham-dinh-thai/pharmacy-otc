import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { Batch } from '../../../domain/batch/batch.entity';
import { BatchStatus } from '../../../domain/batch/batch-status.enum';
import { Inventory } from '../../../domain/inventory.aggregate';
import type { IInventoriesRepository } from '../../../domain/inventories.repository';
import { RestockStockCommand } from './restock-stock.command';
import { RestockStockHandler } from './restock-stock.handler';

const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const BATCH_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6e';
const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const headers = systemActorHeaders();

const inventory = (): Inventory =>
  Inventory.fromPersistent(PRODUCT_ID, [
    Batch.fromPersistent({
      id: BATCH_ID,
      lotNumber: 'LOT-001',
      productId: PRODUCT_ID,
      quantity: 3,
      unitCost: '20000',
      status: BatchStatus.ACTIVE,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      createdBy: headers.actorId,
      createdAt: NOW,
      updatedAt: NOW,
    }),
  ]);

const setup = (current: Inventory | null = inventory()) => {
  const findByProductId = jest
    .fn<IInventoriesRepository['findByProductId']>()
    .mockResolvedValue(current);
  const save = jest.fn<IInventoriesRepository['save']>((value) =>
    Promise.resolve(value),
  );
  const execute = jest.fn<CommandBus['execute']>(() => Promise.resolve({}));
  const run = jest.fn<IUnitOfWork['run']>((work) => work());
  const handler = new RestockStockHandler(
    { findByProductId, save } as unknown as IInventoriesRepository,
    { execute } as unknown as CommandBus,
    { run } as unknown as IUnitOfWork,
  );

  return { handler, findByProductId, save, execute, run };
};

describe('RestockStockHandler', () => {
  it('returns stock to the recorded batches and audits each return', async () => {
    const current = inventory();
    const { handler, findByProductId, save, execute, run } = setup(current);

    const result = await handler.execute(
      new RestockStockCommand(
        [
          {
            productId: PRODUCT_ID,
            batches: [{ batchId: BATCH_ID, quantity: 2 }],
          },
        ],
        headers,
        ORDER_ID,
      ),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(findByProductId).toHaveBeenCalledWith(PRODUCT_ID, {
      forUpdate: true,
    });
    expect(save).toHaveBeenCalledWith(current);
    expect(current.getBatches()[0].getQuantity()).toBe(5);
    expect(result).toEqual([
      { productId: PRODUCT_ID, returned: [{ batchId: BATCH_ID, quantity: 2 }] },
    ]);

    const auditCommands = execute.mock.calls
      .map(([command]) => command)
      .filter(
        (command): command is RecordAuditLogCommand =>
          command instanceof RecordAuditLogCommand,
      );
    expect(auditCommands).toHaveLength(1);
    expect(auditCommands[0].props).toMatchObject({
      action: 'return',
      entityType: 'inventories',
      entityId: PRODUCT_ID,
      before: { quantity: 3 },
      after: { quantity: 5 },
      metadata: { batchId: BATCH_ID, orderId: ORDER_ID },
    });
  });

  it('throws when the product inventory is missing', async () => {
    const { handler, save } = setup(null);

    await expect(
      handler.execute(
        new RestockStockCommand(
          [
            {
              productId: PRODUCT_ID,
              batches: [{ batchId: BATCH_ID, quantity: 1 }],
            },
          ],
          headers,
        ),
      ),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });
});
