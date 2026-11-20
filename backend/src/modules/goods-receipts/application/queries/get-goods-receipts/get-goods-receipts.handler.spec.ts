import { describe, expect, it, jest } from '@jest/globals';
import { GoodsReceipt } from '../../../domain/goods-receipt.aggregate';
import { GoodsReceiptLine } from '../../../domain/goods-receipt-line.entity';
import { GoodsReceiptStatus } from '../../../domain/goods-receipt-status.enum';
import { GetGoodsReceiptsHandler } from './get-goods-receipts.handler';
import { GetGoodsReceiptsQuery } from './get-goods-receipts.query';

const RECEIPT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const SUPPLIER_ID = '0ca741a6-ce41-4010-8148-f7b2a32aef1c';
const PRODUCT_ID = '8a2f6c1e-3b4d-4e5f-9a0b-1c2d3e4f5a6b';

const now = new Date('2026-01-01T00:00:00Z');

const receipt = (): GoodsReceipt =>
  GoodsReceipt.fromPersistent({
    id: RECEIPT_ID,
    code: 'GR-0001',
    supplierId: SUPPLIER_ID,
    status: GoodsReceiptStatus.PENDING,
    createdBy: 'b7eba190-9948-4cfb-a209-94d773775774',
    confirmedBy: null,
    confirmedAt: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    goodsReceiptLines: [
      GoodsReceiptLine.fromPersistent({
        id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
        productId: PRODUCT_ID,
        lotNumber: 'LOT-001',
        quantity: 10,
        unitCost: '2500',
        expiresAt: new Date('2030-01-01'),
        batchId: null,
        createdAt: now,
        updatedAt: now,
      }),
    ],
  });

describe('GetGoodsReceiptsHandler', () => {
  it('maps the repository page and computes totals', async () => {
    const findPage = jest
      .fn<
        (filters: unknown) => Promise<{ items: GoodsReceipt[]; total: number }>
      >()
      .mockResolvedValue({ items: [receipt()], total: 1 });
    const handler = new GetGoodsReceiptsHandler({ findPage } as never);

    const result = await handler.execute(
      new GetGoodsReceiptsQuery(
        'GR-0001',
        GoodsReceiptStatus.PENDING,
        SUPPLIER_ID,
        2,
        10,
      ),
    );

    expect(findPage).toHaveBeenCalledWith({
      search: 'GR-0001',
      status: GoodsReceiptStatus.PENDING,
      supplierId: SUPPLIER_ID,
      limit: 10,
      offset: 10,
    });
    expect(result).toMatchObject({ total: 1, page: 2, limit: 10 });
    expect(result.items[0]).toMatchObject({
      id: RECEIPT_ID,
      code: 'GR-0001',
      status: GoodsReceiptStatus.PENDING,
      lineCount: 1,
      totalQuantity: 10,
      totalCost: '25000',
    });
  });
});
