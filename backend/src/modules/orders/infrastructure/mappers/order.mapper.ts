import { Order } from '../../domain/order.aggregate';
import { OrderLine } from '../../domain/order-line.entity';
import { MikroOrder } from '../entities/mikro-order.entity';
import { MikroOrderLine } from '../entities/mikro-order-line.entity';

export class OrderMapper {
  public static toDomain(
    mikroOrder: MikroOrder,
    mikroLines: MikroOrderLine[],
  ): Order {
    return Order.fromPersistent({
      id: mikroOrder.id,
      checkoutId: mikroOrder.checkoutId,
      userId: mikroOrder.userId,
      lines: mikroLines.map((line) => OrderMapper.toLineDomain(line)),
      shippingName: mikroOrder.shippingName,
      shippingAddress: mikroOrder.shippingAddress,
      shippingPhone: mikroOrder.shippingPhone,
      shippingFee: mikroOrder.shippingFee,
      note: mikroOrder.note,
      status: mikroOrder.status,
      paymentStatus: mikroOrder.paymentStatus,
      confirmedAt: mikroOrder.confirmedAt,
      deliveringAt: mikroOrder.deliveringAt,
      completedAt: mikroOrder.completedAt,
      cancelledAt: mikroOrder.cancelledAt,
      failedAt: mikroOrder.failedAt,
      paidAt: mikroOrder.paidAt,
      createdAt: mikroOrder.createdAt,
      updatedAt: mikroOrder.updatedAt,
    });
  }

  public static toMikro(order: Order): {
    order: MikroOrder;
    lines: MikroOrderLine[];
  } {
    return {
      order: OrderMapper.assign(new MikroOrder(), order),
      lines: order
        .getLines()
        .map((line) => OrderMapper.toLineMikro(line, order.getId())),
    };
  }

  public static assign(mikroOrder: MikroOrder, order: Order): MikroOrder {
    mikroOrder.id = order.getId();
    mikroOrder.checkoutId = order.getCheckoutId();
    mikroOrder.userId = order.getUserId();
    mikroOrder.shippingName = order.getShippingName();
    mikroOrder.shippingAddress = order.getShippingAddress();
    mikroOrder.shippingPhone = order.getShippingPhone();
    mikroOrder.shippingFee = order.getShippingFee();
    mikroOrder.note = order.getNote();
    mikroOrder.status = order.getStatus();
    mikroOrder.paymentStatus = order.getPaymentStatus();
    mikroOrder.confirmedAt = order.getConfirmedAt();
    mikroOrder.deliveringAt = order.getDeliveringAt();
    mikroOrder.completedAt = order.getCompletedAt();
    mikroOrder.cancelledAt = order.getCancelledAt();
    mikroOrder.failedAt = order.getFailedAt();
    mikroOrder.paidAt = order.getPaidAt();
    mikroOrder.createdAt = order.getCreatedAt();
    mikroOrder.updatedAt = order.getUpdatedAt();

    return mikroOrder;
  }

  private static toLineDomain(mikroLine: MikroOrderLine): OrderLine {
    return OrderLine.fromPersistent({
      id: mikroLine.id,
      productId: mikroLine.productId,
      productName: mikroLine.productName,
      productSku: mikroLine.productSku,
      unitPrice: mikroLine.unitPrice,
      quantity: mikroLine.quantity,
    });
  }

  private static toLineMikro(line: OrderLine, orderId: string): MikroOrderLine {
    const mikroLine = new MikroOrderLine();

    mikroLine.id = line.getId();
    mikroLine.orderId = orderId;
    mikroLine.productId = line.getProductId();
    mikroLine.productName = line.getProductName();
    mikroLine.productSku = line.getProductSku();
    mikroLine.unitPrice = line.getUnitPrice();
    mikroLine.quantity = line.getQuantity();

    return mikroLine;
  }
}
