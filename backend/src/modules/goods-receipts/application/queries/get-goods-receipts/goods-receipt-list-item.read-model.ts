import type { GoodsReceiptStatus } from '../../../domain/goods-receipt-status.enum';

export class GoodsReceiptListItemReadModel {
  public constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly supplierId: string,
    public readonly status: GoodsReceiptStatus,
    public readonly lineCount: number,
    public readonly totalQuantity: number,
    public readonly totalCost: string,
    public readonly createdBy: string,
    public readonly confirmedBy: string | null,
    public readonly confirmedAt: Date | null,
    public readonly cancelledBy: string | null,
    public readonly cancelledAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
