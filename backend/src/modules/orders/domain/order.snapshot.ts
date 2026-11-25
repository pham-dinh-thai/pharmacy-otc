import type { Order } from './order.aggregate';
import type { OrderLine } from './order-line.entity';

const lineSnapshot = (line: OrderLine) => ({
  id: line.getId(),
  productId: line.getProductId(),
  productName: line.getProductName(),
  productSku: line.getProductSku(),
  unitPrice: line.getUnitPrice().toString(),
  quantity: line.getQuantity(),
  total: line.getTotal().toString(),
});

/** Snapshot of an order for audit logs and API responses. */
export const orderSnapshot = (order: Order) => ({
  checkoutId: order.getCheckoutId(),
  userId: order.getUserId(),
  status: order.getStatus(),
  paymentStatus: order.getPaymentStatus(),
  shippingName: order.getShippingName(),
  shippingAddress: order.getShippingAddress(),
  shippingPhone: order.getShippingPhone(),
  shippingFee: order.getShippingFee().toString(),
  note: order.getNote(),
  itemsAmount: order.getItemsAmount().toString(),
  totalAmount: order.getTotalAmount().toString(),
  confirmedAt: order.getConfirmedAt()?.toISOString() ?? null,
  deliveringAt: order.getDeliveringAt()?.toISOString() ?? null,
  completedAt: order.getCompletedAt()?.toISOString() ?? null,
  cancelledAt: order.getCancelledAt()?.toISOString() ?? null,
  failedAt: order.getFailedAt()?.toISOString() ?? null,
  paidAt: order.getPaidAt()?.toISOString() ?? null,
  lines: order.getLines().map(lineSnapshot),
});
