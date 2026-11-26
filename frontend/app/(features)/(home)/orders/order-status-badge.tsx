import { orderStatusLabel, type OrderStatus } from '@/lib/orders';

const STATUS_TONES: Record<OrderStatus, string> = {
  pending: 'border-amber-700 text-amber-800',
  confirmed: 'border-sky-700 text-sky-800',
  delivering: 'border-accent text-accent',
  completed: 'border-emerald-700 text-emerald-800',
  cancelled: 'border-red-600 text-red-700',
  failed: 'border-red-600 text-red-700',
};

const STATUS_RAILS: Record<OrderStatus, string> = {
  pending: 'bg-amber-600',
  confirmed: 'bg-sky-700',
  delivering: 'bg-accent',
  completed: 'bg-emerald-700',
  cancelled: 'bg-red-600',
  failed: 'bg-red-600',
};

export function orderStatusRail(status: OrderStatus): string {
  return STATUS_RAILS[status];
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${STATUS_TONES[status]}`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
