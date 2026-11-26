'use server';

import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  ORDER_FEED_LIMIT,
  ORDER_STATUS_FILTERS,
  type Order,
  type OrderPage,
  type OrderStatus,
} from '@/lib/orders';
import { withOrderListThumbnails } from '@/lib/order-thumbnails';

export type MoreOrders = {
  items: Order[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function loadMoreOrdersAction(
  rawStatus: string,
  cursor: string,
): Promise<MoreOrders> {
  const user = await fetchCurrentUser();

  if (!user) throw new Error('Unauthorized');

  const status = ORDER_STATUS_FILTERS.some((item) => item.value === rawStatus)
    ? (rawStatus as OrderStatus | 'all')
    : 'all';
  const params = new URLSearchParams({ cursor, limit: String(ORDER_FEED_LIMIT) });

  if (status !== 'all') params.set('status', status);

  const response = await authFetch(`/orders?${params}`);

  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok) throw new Error(`Failed to load orders: ${response.status}`);

  const page = (await response.json()) as OrderPage;

  return {
    items: await withOrderListThumbnails(page.items),
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  };
}
