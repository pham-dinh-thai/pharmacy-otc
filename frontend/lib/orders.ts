export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type OrderPaymentStatus = 'unpaid' | 'paid';

export type OrderLine = {
  productId: string;
  productName: string;
  productSku: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  imageUrl?: string | null;
};

export type Order = {
  id: string;
  checkoutId: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  itemCount: number;
  totalQuantity: number;
  itemsAmount: string;
  shippingFee: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  lines: OrderLine[];
};

export type OrderDetail = Order & {
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  note: string | null;
  confirmedAt: string | null;
  deliveringAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  failedAt: string | null;
  paidAt: string | null;
};

export type OrderPage = {
  items: Order[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

export const ORDER_FEED_LIMIT = 20;

export const ORDER_STATUS_FILTERS: readonly {
  value: OrderStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'delivering', label: 'Đang giao' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'failed', label: 'Thất bại' },
];

export function orderStatusLabel(status: OrderStatus): string {
  return (
    ORDER_STATUS_FILTERS.find((item) => item.value === status)?.label ?? status
  );
}

export function formatOrderDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}
