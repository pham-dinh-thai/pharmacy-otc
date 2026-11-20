import { Query } from '@nestjs/cqrs';
import { InventorySummaryPageReadModel } from './inventory-summary-page.read-model';

export class GetInventorySummaryQuery extends Query<InventorySummaryPageReadModel> {
  public readonly page: number;
  public readonly limit: number;

  public constructor(
    public readonly productId?: string | null,
    page?: number,
    limit?: number,
  ) {
    super();
    this.page = Math.max(1, page ?? 1);
    this.limit = Math.min(100, Math.max(1, limit ?? 20));
  }
}
