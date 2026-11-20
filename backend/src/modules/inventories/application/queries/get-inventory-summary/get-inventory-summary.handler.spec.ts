import { describe, expect, it, jest } from '@jest/globals';
import { GetInventorySummaryHandler } from './get-inventory-summary.handler';
import { GetInventorySummaryQuery } from './get-inventory-summary.query';
import type { InventorySummaryPage } from '../../../domain/inventories.repository';

const PRODUCT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const now = new Date('2026-01-01T00:00:00Z');

describe('GetInventorySummaryHandler', () => {
  it('maps the repository page', async () => {
    const page: InventorySummaryPage = {
      items: [
        {
          productId: PRODUCT_ID,
          totalQuantity: 12,
          batchCount: 2,
          nearestExpiry: new Date('2030-01-01'),
          stockValue: '30000',
          updatedAt: now,
        },
      ],
      total: 1,
    };
    const findInventorySummaryPage = jest
      .fn<(filters: unknown) => Promise<InventorySummaryPage>>()
      .mockResolvedValue(page);
    const handler = new GetInventorySummaryHandler({
      findInventorySummaryPage,
    } as never);

    const result = await handler.execute(
      new GetInventorySummaryQuery(PRODUCT_ID, 2, 10),
    );

    expect(findInventorySummaryPage).toHaveBeenCalledWith({
      productId: PRODUCT_ID,
      limit: 10,
      offset: 10,
    });
    expect(result).toMatchObject({ total: 1, page: 2, limit: 10 });
    expect(result.items[0]).toMatchObject({
      productId: PRODUCT_ID,
      totalQuantity: 12,
      batchCount: 2,
      stockValue: '30000',
    });
  });
});
