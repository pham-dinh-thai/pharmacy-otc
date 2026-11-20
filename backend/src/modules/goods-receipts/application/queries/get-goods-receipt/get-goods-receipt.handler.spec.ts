import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { GoodsReceipt } from '../../../domain/goods-receipt.aggregate';
import { GoodsReceiptLine } from '../../../domain/goods-receipt-line.entity';
import { GoodsReceiptStatus } from '../../../domain/goods-receipt-status.enum';
import { GetGoodsReceiptHandler } from './get-goods-receipt.handler';
import { GetGoodsReceiptQuery } from './get-goods-receipt.query';

const RECEIPT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const SUPPLIER_ID = '0ca741a6-ce41-4010-8148-f7b2a32aef1c';
const PRODUCT_ID = '8a2f6c1e-3b4d-4e5f-9a0b-1c2d3e4f5a6b';
const now = new Date('2026-01-01T00:00:00Z');

const receipt = (): GoodsReceipt =>
  GoodsReceipt.fromPersistent({
    id: RECEIPT_ID,
    code: 'GR-0001',
    supplierId: SUPPLIER_ID,
    status: GoodsReceiptStatus.CONFIRMED,
    createdBy: 'b7eba190-9948-4cfb-a209-94d773775774',
    confirmedBy: 'b7eba190-9948-4cfb-a209-94d773775774',
    confirmedAt: now,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    goodsReceiptLines: [
      GoodsReceiptLine.fromPersistent({
        id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
        productId: PRODUCT_ID,
        lotNumber: 'LOT-001',
        quantity: 5,
        unitCost: '2500',
        expiresAt: new Date('2030-01-01'),
        batchId: 'd2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f60',
        createdAt: now,
        updatedAt: now,
      }),
    ],
  });

describe('GetGoodsReceiptHandler', () => {
  it('returns the receipt with its lines', async () => {
    const findById = jest
      .fn<(id: string) => Promise<GoodsReceipt | null>>()
      .mockResolvedValue(receipt());
    const handler = new GetGoodsReceiptHandler({ findById } as never);

    const result = await handler.execute(new GetGoodsReceiptQuery(RECEIPT_ID));

    expect(findById).toHaveBeenCalledWith(RECEIPT_ID);
    expect(result).toMatchObject({
      id: RECEIPT_ID,
      code: 'GR-0001',
      status: GoodsReceiptStatus.CONFIRMED,
      lineCount: 1,
    });
    expect(result.lines[0]).toMatchObject({
      productId: PRODUCT_ID,
      lotNumber: 'LOT-001',
      quantity: 5,
      totalCost: '12500',
    });
  });

  it('throws when the receipt is missing', async () => {
    const findById = jest
      .fn<(id: string) => Promise<GoodsReceipt | null>>()
      .mockResolvedValue(null);
    const handler = new GetGoodsReceiptHandler({ findById } as never);

    await expect(
      handler.execute(new GetGoodsReceiptQuery(RECEIPT_ID)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
