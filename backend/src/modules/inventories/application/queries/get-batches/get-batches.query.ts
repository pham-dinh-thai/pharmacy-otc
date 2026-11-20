import { Query } from '@nestjs/cqrs';
import type { BatchStatus } from '../../../domain/batch/batch-status.enum';
import { BatchListPageReadModel } from './batch-list-page.read-model';

export class GetBatchesQuery extends Query<BatchListPageReadModel> {
  public readonly page: number;
  public readonly limit: number;

  public constructor(
    public readonly productId?: string | null,
    public readonly lotNumber?: string | null,
    public readonly status?: BatchStatus | 'all',
    public readonly expiresBefore?: Date | null,
    page?: number,
    limit?: number,
  ) {
    super();
    this.page = Math.max(1, page ?? 1);
    this.limit = Math.min(100, Math.max(1, limit ?? 20));
  }
}
