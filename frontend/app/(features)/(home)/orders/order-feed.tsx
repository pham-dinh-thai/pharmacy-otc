'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Order } from '@/lib/orders';
import { OrderCard } from './order-card';
import { loadMoreOrdersAction } from './load-more';

export function OrderFeed({
  initialOrders,
  initialCursor,
  status,
  returnTo,
}: {
  initialOrders: Order[];
  initialCursor: string | null;
  status: string;
  returnTo: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const page = await loadMoreOrdersAction(status, cursor);
      setOrders((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      setError('Không tải thêm được đơn hàng. Vui lòng thử lại.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, status]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: '240px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMore, cursor]);

  return (
    <div className="bg-surface p-4">
      {orders.length === 0 ? (
        <p className="px-2 py-10 text-center text-[13px] text-muted">
          Không có đơn hàng nào phù hợp với bộ lọc.
        </p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} returnTo={returnTo} />
          ))}
        </div>
      )}

      <div
        ref={sentinelRef}
        aria-live="polite"
        className="flex min-h-12 items-center justify-center py-6 text-[13px] text-muted"
      >
        {loading && <span>Đang tải thêm đơn hàng…</span>}
        {!loading && error && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="border border-rule bg-paper px-4 py-2 font-medium text-accent hover:border-accent"
          >
            {error} Bấm để thử lại
          </button>
        )}
        {!loading && !error && !cursor && orders.length > 0 && (
          <span>Bạn đã xem hết đơn hàng.</span>
        )}
      </div>
    </div>
  );
}
