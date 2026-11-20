import { GoodsReceipt } from './goods-receipt.aggregate';
import type { GoodsReceiptStatus } from './goods-receipt-status.enum';

export type FindGoodsReceiptOptions = {
  forUpdate?: boolean;
};

export type FindGoodsReceiptsFilters = {
  search?: string | null;
  status?: GoodsReceiptStatus | 'all';
  supplierId?: string | null;
  limit?: number;
  offset?: number;
};

export type GoodsReceiptPage = {
  items: GoodsReceipt[];
  total: number;
};

export interface IGoodsReceiptsRepository {
  nextSequence(): Promise<number>;

  findPage(filters?: FindGoodsReceiptsFilters): Promise<GoodsReceiptPage>;

  findById(
    id: string,
    options?: FindGoodsReceiptOptions,
  ): Promise<GoodsReceipt | null>;

  create(goodsReceipt: GoodsReceipt): Promise<GoodsReceipt>;

  update(goodsReceipt: GoodsReceipt): Promise<GoodsReceipt>;
}

export const GOODS_RECEIPTS_REPOSITORY = 'IGoodsReceiptsRepository';
