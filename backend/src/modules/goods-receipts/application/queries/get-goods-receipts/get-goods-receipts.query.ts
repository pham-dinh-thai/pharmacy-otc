import { Query } from '@nestjs/cqrs';
import type { GoodsReceiptStatus } from '../../../domain/goods-receipt-status.enum';
import { GoodsReceiptListPageReadModel } from './goods-receipt-list-page.read-model';

export class GetGoodsReceiptsQuery extends Query<GoodsReceiptListPageReadModel> {
  public readonly page: number;
  public readonly limit: number;

  public constructor(
    public readonly search?: string | null,
    public readonly status?: GoodsReceiptStatus | 'all',
    public readonly supplierId?: string | null,
    page?: number,
    limit?: number,
  ) {
    super();
    this.page = Math.max(1, page ?? 1);
    this.limit = Math.min(100, Math.max(1, limit ?? 20));
  }
}
