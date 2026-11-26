import { BadRequestException, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from '../../../domain/orders.repository';
import { decodeOrderCursor, encodeOrderCursor } from './order.cursor';
import { GetOrdersQuery } from './get-orders.query';
import { OrderLineReadModel } from './order-line.read-model';
import { OrderListItemReadModel } from './order-list-item.read-model';
import { OrderListPageReadModel } from './order-list-page.read-model';

@QueryHandler(GetOrdersQuery)
export class GetOrdersHandler implements IQueryHandler<
  GetOrdersQuery,
  OrderListPageReadModel
> {
  public constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
  ) {}

  public async execute(query: GetOrdersQuery): Promise<OrderListPageReadModel> {
    const before = query.cursor ? decodeOrderCursor(query.cursor) : null;

    if (query.cursor && !before) {
      throw new BadRequestException('Invalid orders cursor');
    }

    const result = await this.ordersRepository.findPage({
      userId: query.userId,
      status: query.status,
      limit: query.limit,
      ...(before ? { before } : {}),
    });

    const items = result.items.map((order) => {
      const lines = order.getLines();

      return new OrderListItemReadModel(
        order.getId(),
        order.getCheckoutId(),
        order.getStatus(),
        order.getPaymentStatus(),
        lines.length,
        lines.reduce((sum, line) => sum + line.getQuantity(), 0),
        order.getItemsAmount().toString(),
        order.getShippingFee().toString(),
        order.getTotalAmount().toString(),
        order.getCreatedAt(),
        order.getUpdatedAt(),
        lines.map(
          (line) =>
            new OrderLineReadModel(
              line.getProductId(),
              line.getProductName(),
              line.getProductSku(),
              line.getUnitPrice().toString(),
              line.getQuantity(),
              line.getTotal().toBigInt().toString(),
            ),
        ),
      );
    });

    const lastOrder = result.items[result.items.length - 1];

    return new OrderListPageReadModel(
      items,
      result.hasMore && lastOrder ? encodeOrderCursor(lastOrder) : null,
      result.hasMore,
      query.limit,
    );
  }
}
