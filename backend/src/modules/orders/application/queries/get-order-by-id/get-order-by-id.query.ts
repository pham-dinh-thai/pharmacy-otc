import { Query } from '@nestjs/cqrs';
import type { OrderDetailReadModel } from './order-detail.read-model';

export class GetOrderByIdQuery extends Query<OrderDetailReadModel> {
  public constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {
    super();
  }
}
