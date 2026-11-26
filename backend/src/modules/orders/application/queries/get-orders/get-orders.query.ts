import { Query } from '@nestjs/cqrs';
import type { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderListPageReadModel } from './order-list-page.read-model';

export class GetOrdersQuery extends Query<OrderListPageReadModel> {
  public readonly limit: number;

  public constructor(
    public readonly userId: string,
    public readonly status: OrderStatus | 'all',
    public readonly cursor?: string,
    limit?: number,
  ) {
    super();
    this.limit = Math.min(100, Math.max(1, limit ?? 20));
  }
}
