import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Batch } from '../../../domain/batch/batch.entity';
import { BatchStatus } from '../../../domain/batch/batch-status.enum';
import { GetBatchHandler } from './get-batch.handler';
import { GetBatchQuery } from './get-batch.query';

const BATCH_ID = '0ca741a6-ce41-4010-8148-f7b2a32aef1c';
const PRODUCT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const CREATED_BY = 'b7eba190-9948-4cfb-a209-94d773775774';

const batch = (): Batch =>
  Batch.create({
    lotNumber: 'LOT-001',
    productId: PRODUCT_ID,
    quantity: 5,
    unitCost: '2500',
    status: BatchStatus.ACTIVE,
    expiresAt: new Date('2030-01-01'),
    createdBy: CREATED_BY,
  });

describe('GetBatchHandler', () => {
  it('returns the batch detail', async () => {
    const findBatchById = jest
      .fn<(id: string) => Promise<Batch | null>>()
      .mockResolvedValue(batch());
    const handler = new GetBatchHandler({ findBatchById } as never);

    const result = await handler.execute(new GetBatchQuery(BATCH_ID));

    expect(findBatchById).toHaveBeenCalledWith(BATCH_ID);
    expect(result).toMatchObject({
      productId: PRODUCT_ID,
      lotNumber: 'LOT-001',
      quantity: 5,
      totalCost: '12500',
      createdBy: CREATED_BY,
    });
  });

  it('throws when the batch is missing', async () => {
    const findBatchById = jest
      .fn<(id: string) => Promise<Batch | null>>()
      .mockResolvedValue(null);
    const handler = new GetBatchHandler({ findBatchById } as never);

    await expect(
      handler.execute(new GetBatchQuery(BATCH_ID)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
