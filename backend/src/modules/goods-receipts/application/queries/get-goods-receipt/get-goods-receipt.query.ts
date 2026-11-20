import { Query } from '@nestjs/cqrs';
import { GoodsReceiptDetailReadModel } from './goods-receipt-detail.read-model';

export class GetGoodsReceiptQuery extends Query<GoodsReceiptDetailReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
