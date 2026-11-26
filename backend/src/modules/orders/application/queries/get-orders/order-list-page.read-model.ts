import { OrderListItemReadModel } from './order-list-item.read-model';

export class OrderListPageReadModel {
  public constructor(
    public readonly items: OrderListItemReadModel[],
    public readonly nextCursor: string | null,
    public readonly hasMore: boolean,
    public readonly limit: number,
  ) {}
}
