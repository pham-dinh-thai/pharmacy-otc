import { describe, expect, it, jest } from '@jest/globals';
import { Batch } from '../../../domain/batch/batch.entity';
import { BatchStatus } from '../../../domain/batch/batch-status.enum';
import type { BatchPage } from '../../../domain/inventories.repository';
import { GetBatchesHandler } from './get-batches.handler';
import { GetBatchesQuery } from './get-batches.query';

const PRODUCT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const batch = (): Batch =>
  Batch.create({
    lotNumber: 'LOT-001',
    productId: PRODUCT_ID,
    quantity: 10,
    unitCost: '2500',
    status: BatchStatus.ACTIVE,
    expiresAt: new Date('2030-01-01'),
    createdBy: 'b7eba190-9948-4cfb-a209-94d773775774',
  });

describe('GetBatchesHandler', () => {
  it('maps the repository page', async () => {
    const value = batch();
    const page: BatchPage = { items: [value], total: 1 };
    const findBatchesPage = jest
      .fn<(filters: unknown) => Promise<BatchPage>>()
      .mockResolvedValue(page);
    const expiresBefore = new Date('2030-06-01');
    const handler = new GetBatchesHandler({ findBatchesPage } as never);

    const result = await handler.execute(
      new GetBatchesQuery(
        PRODUCT_ID,
        'LOT-001',
        BatchStatus.ACTIVE,
        expiresBefore,
        2,
        10,
      ),
    );

    expect(findBatchesPage).toHaveBeenCalledWith({
      productId: PRODUCT_ID,
      lotNumber: 'LOT-001',
      status: BatchStatus.ACTIVE,
      expiresBefore,
      limit: 10,
      offset: 10,
    });
    expect(result).toMatchObject({ total: 1, page: 2, limit: 10 });
    expect(result.items[0]).toMatchObject({
      productId: PRODUCT_ID,
      lotNumber: 'LOT-001',
      quantity: 10,
      totalCost: '25000',
      status: BatchStatus.ACTIVE,
    });
  });
});
