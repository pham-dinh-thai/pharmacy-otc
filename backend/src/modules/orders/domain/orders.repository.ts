import type { Order } from './order.aggregate';
import type { OrderPaymentStatus } from './enums/order-payment-status.enum';
import type { OrderStatus } from './enums/order-status.enum';

export type FindOrderOptions = {
  forUpdate?: boolean;
};

export type OrderCursor = {
  createdAt: Date;
  id: string;
};

export type FindOrdersFilters = {
  userId?: string;
  checkoutId?: string;
  status?: OrderStatus | 'all';
  paymentStatus?: OrderPaymentStatus | 'all';
  limit?: number;
  before?: OrderCursor;
};

export type OrderPage = {
  items: Order[];
  hasMore: boolean;
};

export interface IOrdersRepository {
  findPage(filters?: FindOrdersFilters): Promise<OrderPage>;

  findById(id: string, options?: FindOrderOptions): Promise<Order | null>;

  findByCheckoutId(checkoutId: string): Promise<Order | null>;

  create(order: Order): Promise<Order>;

  update(order: Order): Promise<Order>;
}

export const ORDERS_REPOSITORY = 'IOrdersRepository';
