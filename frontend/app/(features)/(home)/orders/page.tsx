import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import { first } from '@/lib/list-filters';
import {
  ORDER_FEED_LIMIT,
  ORDER_STATUS_FILTERS,
  type OrderPage,
  type OrderStatus,
} from '@/lib/orders';
import { withOrderListThumbnails } from '@/lib/order-thumbnails';
import { fetchStorefrontCategories } from '@/lib/storefront';
import { OrderFeed } from './order-feed';
import { OrderFilters } from './order-filters';

export const metadata = {
  title: 'Đơn hàng của tôi | PharmaOTC',
};

type SearchParams = {
  status?: string | string[];
  error?: string | string[];
  updated?: string | string[];
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Không xác định được đơn hàng. Vui lòng thử lại.',
  notfound: 'Không tìm thấy đơn hàng hoặc sản phẩm trong đơn.',
  conflict: 'Đơn hàng không còn ở trạng thái cho phép huỷ.',
  invalid: 'Thao tác không hợp lệ. Vui lòng kiểm tra lại.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  cancelled: 'Đã huỷ đơn hàng. Số sản phẩm đã mua được hoàn lại vào kho.',
};

export default function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<OrdersFallback />}>
      <OrdersRoute searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const status = ORDER_STATUS_FILTERS.some((item) => item.value === rawStatus)
    ? (rawStatus as OrderStatus | 'all')
    : 'all';
  const listHref =
    status === 'all' ? '/orders' : `/orders?status=${encodeURIComponent(status)}`;

  const user = await fetchCurrentUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(listHref)}`);

  const categories = await fetchStorefrontCategories();
  const query = new URLSearchParams({ limit: String(ORDER_FEED_LIMIT) });

  if (status !== 'all') query.set('status', status);

  let response: Response;
  try {
    response = await authFetch(`/orders?${query}`);
  } catch {
    throw new Error('Failed to fetch orders: network error');
  }

  if (response.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (!response.ok) throw new Error(`Failed to fetch orders: ${response.status}`);

  const result = (await response.json()) as OrderPage;
  const orders = await withOrderListThumbnails(result.items);

  const errorMessage = first(params.error)
    ? (ERROR_MESSAGES[first(params.error)] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage = !errorMessage && first(params.updated)
    ? UPDATED_MESSAGES[first(params.updated)]
    : undefined;

  return (
    <StorefrontShell categories={categories}>
      <Container className="pt-8 pb-12 lg:pt-10 lg:pb-16">
        <nav
          aria-label="Đường dẫn"
          className="flex items-center gap-2 text-[12px] text-muted"
        >
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">Đơn hàng của tôi</span>
        </nav>

        <div className="mt-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
            Đơn hàng của tôi
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            Theo dõi đơn hàng, huỷ đơn còn có thể xử lý hoặc mua lại chỉ với
            một chạm.
          </p>
        </div>

        <div className="mt-6">
          <FormMessage message={errorMessage} />
          <FormMessage message={updatedMessage} tone="success" />
        </div>

        <OrderFilters status={status} />

        <OrderFeed
          key={status}
          initialOrders={orders}
          initialCursor={result.nextCursor}
          status={status}
          returnTo={listHref}
        />
      </Container>
    </StorefrontShell>
  );
}

function OrdersFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16" />
      <Container className="py-8 lg:py-10">
        <div className="h-3 w-28 bg-surface" />
        <div className="mt-6">
          <div className="h-8 w-48 bg-surface" />
          <div className="mt-2 h-4 w-64 bg-surface" />
        </div>
      </Container>
    </div>
  );
}
