import { formatOrderDate, type Order } from '@/lib/orders';
import { formatVND } from '@/lib/utils';
import { OrderCardActions } from './order-card-actions';
import { OrderLines } from './order-lines';
import { OrderStatusBadge, orderStatusRail } from './order-status-badge';

export function OrderCard({
  order,
  returnTo,
}: {
  order: Order;
  returnTo: string;
}) {
  const canCancel =
    order.status === 'pending' || order.status === 'confirmed';
  const detailHref = `/orders/${order.id}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <article className="relative border border-rule bg-paper">
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${orderStatusRail(order.status)}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-7 pt-5 pb-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2
            className="text-[14px] font-semibold tabular-nums"
            title={order.id}
          >
            Đơn #{order.id.slice(0, 8)}
          </h2>
          <span className="text-[12px] text-muted">
            {formatOrderDate(order.createdAt)}
          </span>
          <span className="text-[12px] text-muted">
            {order.itemCount} mặt hàng
          </span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderLines lines={order.lines} />

      <div className="px-7 pt-5 pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] text-muted">
            Tổng đơn
            <span className="ml-2 text-[11px]">
              {order.paymentStatus === 'paid'
                ? 'Đã thanh toán'
                : 'Chưa thanh toán'}
            </span>
          </p>
          <p className="text-[16px] font-semibold tabular-nums text-accent">
            {formatVND(Number(order.totalAmount))}
          </p>
        </div>

        <OrderCardActions
          orderId={order.id}
          returnTo={returnTo}
          canCancel={canCancel}
          detailHref={detailHref}
        />
      </div>
    </article>
  );
}
