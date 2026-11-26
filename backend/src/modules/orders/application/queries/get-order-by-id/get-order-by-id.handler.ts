import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrderNotFoundException } from '../../../domain/exceptions/order.exception';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from '../../../domain/orders.repository';
import { OrderLineReadModel } from '../get-orders/order-line.read-model';
import { GetOrderByIdQuery } from './get-order-by-id.query';
import { OrderDetailReadModel } from './order-detail.read-model';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdHandler implements IQueryHandler<
  GetOrderByIdQuery,
  OrderDetailReadModel
> {
  public constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
  ) {}

  public async execute(
    query: GetOrderByIdQuery,
  ): Promise<OrderDetailReadModel> {
    const order = await this.ordersRepository.findById(query.orderId);

    if (!order || order.getUserId() !== query.userId) {
      throw new OrderNotFoundException(query.orderId);
    }

    const lines = order.getLines();

    return new OrderDetailReadModel(
      order.getId(),
      order.getCheckoutId(),
      order.getStatus(),
      order.getPaymentStatus(),
      order.getShippingName(),
      order.getShippingAddress(),
      order.getShippingPhone(),
      order.getNote(),
      lines.length,
      lines.reduce((sum, line) => sum + line.getQuantity(), 0),
      order.getItemsAmount().toString(),
      order.getShippingFee().toString(),
      order.getTotalAmount().toString(),
      order.getCreatedAt(),
      order.getUpdatedAt(),
      order.getConfirmedAt(),
      order.getDeliveringAt(),
      order.getCompletedAt(),
      order.getCancelledAt(),
      order.getFailedAt(),
      order.getPaidAt(),
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
  }
}
