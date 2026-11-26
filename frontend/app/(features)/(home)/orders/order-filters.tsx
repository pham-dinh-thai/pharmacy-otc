import Link from 'next/link';
import { ORDER_STATUS_FILTERS } from '@/lib/orders';

export function OrderFilters({ status }: { status: string }) {
  return (
    <nav
      aria-label="Lọc đơn hàng theo trạng thái"
      className="mt-6 flex gap-6 overflow-x-auto border-b border-rule"
    >
      {ORDER_STATUS_FILTERS.map((option) => {
        const active = option.value === status;

        return (
          <Link
            key={option.value}
            href={
              option.value === 'all' ? '/orders' : `/orders?status=${option.value}`
            }
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 border-b-2 px-1 pb-3 text-[13px] font-medium transition-colors ${
              active
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:border-rule hover:text-ink'
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
