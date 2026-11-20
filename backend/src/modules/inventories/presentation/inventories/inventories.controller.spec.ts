import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { jest } from '@jest/globals';
import { InventoriesController } from './inventories.controller';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { IssueBatchStockCommand } from '../../application/commands/issue-batch-stock/issue-batch-stock.command';
import { ReconcileBatchStockCommand } from '../../application/commands/reconcile-batch-stock/reconcile-batch-stock.command';
import { GetInventorySummaryQuery } from '../../application/queries/get-inventory-summary/get-inventory-summary.query';
import { GetBatchesQuery } from '../../application/queries/get-batches/get-batches.query';
import { GetBatchQuery } from '../../application/queries/get-batch/get-batch.query';
import { BatchStatus } from '../../domain/batch/batch-status.enum';

const PRODUCT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const BATCH_ID = '0ca741a6-ce41-4010-8148-f7b2a32aef1c';

const headers = {
  actorId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

describe('InventoriesController', () => {
  let controller: InventoriesController;
  let execute: jest.Mock<(command: unknown) => Promise<unknown>>;
  let queryExecute: jest.Mock<(query: unknown) => Promise<unknown>>;

  beforeEach(async () => {
    execute = jest.fn<(command: unknown) => Promise<unknown>>();
    queryExecute = jest.fn<(query: unknown) => Promise<unknown>>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoriesController],
      providers: [
        { provide: CommandBus, useValue: { execute } },
        { provide: QueryBus, useValue: { execute: queryExecute } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InventoriesController>(InventoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('dispatches IssueBatchStockCommand with actor headers', async () => {
    execute.mockResolvedValue(6);

    const result = await controller.issueBatchStock(
      PRODUCT_ID,
      BATCH_ID,
      { quantity: 4 },
      headers,
    );

    expect(execute).toHaveBeenCalledWith(
      new IssueBatchStockCommand(PRODUCT_ID, BATCH_ID, 4, headers),
    );
    expect(result).toEqual({ quantity: 6 });
  });

  it('dispatches ReconcileBatchStockCommand with actor headers', async () => {
    execute.mockResolvedValue(7);

    const result = await controller.reconcileBatchStock(
      PRODUCT_ID,
      BATCH_ID,
      { quantity: 7 },
      headers,
    );

    expect(execute).toHaveBeenCalledWith(
      new ReconcileBatchStockCommand(PRODUCT_ID, BATCH_ID, 7, headers),
    );
    expect(result).toEqual({ quantity: 7 });
  });

  it('dispatches GetInventorySummaryQuery', async () => {
    const page = { items: [], total: 0, page: 1, limit: 20 };

    queryExecute.mockResolvedValue(page);

    const result = await controller.findSummary({
      productId: PRODUCT_ID,
      page: 1,
      limit: 20,
    });

    expect(queryExecute).toHaveBeenCalledWith(
      new GetInventorySummaryQuery(PRODUCT_ID, 1, 20),
    );
    expect(result).toBe(page);
  });

  it('dispatches GetBatchesQuery with filters', async () => {
    const expiresBefore = new Date('2026-12-31');
    const page = { items: [], total: 0, page: 1, limit: 20 };

    queryExecute.mockResolvedValue(page);

    const result = await controller.findBatches({
      productId: PRODUCT_ID,
      lotNumber: 'LOT-1',
      status: BatchStatus.ACTIVE,
      expiresBefore,
      page: 1,
      limit: 20,
    });

    expect(queryExecute).toHaveBeenCalledWith(
      new GetBatchesQuery(
        PRODUCT_ID,
        'LOT-1',
        BatchStatus.ACTIVE,
        expiresBefore,
        1,
        20,
      ),
    );
    expect(result).toBe(page);
  });

  it('dispatches GetBatchQuery with the batch id', async () => {
    const detail = { id: BATCH_ID, lines: [] };

    queryExecute.mockResolvedValue(detail);

    const result = await controller.findBatch(BATCH_ID);

    expect(queryExecute).toHaveBeenCalledWith(new GetBatchQuery(BATCH_ID));
    expect(result).toBe(detail);
  });
});
