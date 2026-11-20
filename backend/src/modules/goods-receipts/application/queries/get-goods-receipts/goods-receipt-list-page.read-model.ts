import { GoodsReceiptListItemReadModel } from './goods-receipt-list-item.read-model';

export class GoodsReceiptListPageReadModel {
  public constructor(
    public readonly items: GoodsReceiptListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
