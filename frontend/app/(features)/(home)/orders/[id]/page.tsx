import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import { first } from '@/lib/list-filters';
import { withOrderDetailThumbnails } from '@/lib/order-thumbnails';
import {
  formatOrderDate,
  type OrderDetail,
} from '@/lib/orders';
import { fetchStorefrontCategories } from '@/lib/storefront';
import { formatVND } from '@/lib/utils';
import { OrderCardActions } from '../order-card-actions';
import { ProductThumb } from '../product-thumb';
import { OrderStatusBadge } from '../order-status-badge';

export const metadata = {
  title: 'Chi tiết đơn hàng | PharmaOTC',
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default function OrderDetailPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<OrderDetailFallback />}>
      <OrderDetailRoute params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderDetailRoute({ params, searchParams }: PageProps) {
  const { id } = await params;
  const requestedReturn = first((await searchParams).returnTo);
  const listHref =
    requestedReturn === '/orders' || requestedReturn.startsWith('/orders?')
      ? requestedReturn
      : '/orders';
  const detailHref =
    requestedReturn === listHref
      ? `/orders/${id}?returnTo=${encodeURIComponent(listHref)}`
      : `/orders/${id}`;

  const user = await fetchCurrentUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(detailHref)}`);

  const categories = await fetchStorefrontCategories();

  let response: Response;
  try {
    response = await authFetch(`/orders/${encodeURIComponent(id)}`);
  } catch {
    throw new Error('Failed to fetch order: network error');
  }

  if (response.status === 401) {
    redirect(`/login?next=${encodeURIComponent(detailHref)}`);
  }
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Failed to fetch order: ${response.status}`);

  const order = await withOrderDetailThumbnails(
    (await response.json()) as OrderDetail,
  );
  const canCancel =
    order.status === 'pending' || order.status === 'confirmed';
  const timeline = [
    { label: 'Đặt hàng', at: order.createdAt },
    { label: 'Xác nhận', at: order.confirmedAt },
    { label: 'Đang giao', at: order.deliveringAt },
    { label: 'Hoàn tất', at: order.completedAt },
    { label: 'Đã thanh toán', at: order.paidAt },
    { label: 'Thất bại', at: order.failedAt },
    { label: 'Đã huỷ', at: order.cancelledAt },
  ].filter(
    (entry): entry is { label: string; at: string } => entry.at !== null,
  );

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
          <Link href={listHref} className="hover:text-accent">
            Đơn hàng của tôi
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">Chi tiết</span>
        </nav>

        <div className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="text-[28px] font-bold leading-tight tracking-[-0.02em]"
                  title={order.id}
                >
                  Đơn #{order.id.slice(0, 8)}
                </h1>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-2 text-[13px] text-muted">
                Đặt lúc {formatOrderDate(order.createdAt)} · Cập nhật lúc{' '}
                {formatOrderDate(order.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap">
              <OrderCardActions
                orderId={order.id}
                returnTo={listHref}
                canCancel={canCancel}
              />
            </div>
          </div>
        </div>

        <Link
          href={listHref}
          className="mt-6 inline-block text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách đơn hàng
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="grid gap-6">
            <section className="border border-rule bg-paper">
              <div className="px-6 pt-5 pb-2">
                <h2 className="text-[15px] font-semibold">Thông tin giao hàng</h2>
              </div>
              <dl className="grid gap-x-8 gap-y-4 px-6 py-5 text-[13px] sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Người nhận</dt>
                  <dd className="mt-1 font-medium">{order.shippingName}</dd>
                </div>
                <div>
                  <dt className="text-muted">Điện thoại</dt>
                  <dd className="mt-1 tabular-nums">{order.shippingPhone}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted">Địa chỉ</dt>
                  <dd className="mt-1">{order.shippingAddress}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted">Ghi chú</dt>
                  <dd className="mt-1">{order.note ?? '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="border border-rule bg-paper">
              <div className="px-6 pt-5 pb-2">
                <h2 className="text-[15px] font-semibold">
                  Sản phẩm trong đơn
                </h2>
              </div>
              <ul className="space-y-4 px-6 pb-5">
                {order.lines.map((line) => (
                  <li key={line.productId} className="flex gap-4 text-[13px]">
                    <ProductThumb line={line} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-5">{line.productName}</p>
                      <p className="mt-1 text-muted">
                        {line.productSku ? `Mã: ${line.productSku} · ` : ''}x
                        {line.quantity}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular-nums font-semibold">
                        {formatVND(Number(line.unitPrice))}
                      </p>
                      <p className="mt-1 tabular-nums text-muted">
                        {formatVND(Number(line.lineTotal))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="grid gap-6 lg:self-start">
            <section className="border border-rule bg-paper p-6">
              <h2 className="text-[15px] font-semibold">Tổng tiền</h2>
              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Tạm tính</dt>
                  <dd className="tabular-nums">
                    {formatVND(Number(order.itemsAmount))}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Phí giao hàng</dt>
                  <dd className="tabular-nums">
                    {formatVND(Number(order.shippingFee))}
                  </dd>
                </div>
                <div className="mt-3 flex justify-between gap-4 text-[15px] font-semibold">
                  <dt>Tổng thanh toán</dt>
                  <dd className="tabular-nums">
                    {formatVND(Number(order.totalAmount))}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-[12px] text-muted">
                {order.paymentStatus === 'paid'
                  ? 'Đã thanh toán'
                  : 'Chưa thanh toán'}
              </p>
            </section>

            <section className="border border-rule bg-paper p-6">
              <h2 className="text-[15px] font-semibold">Tiến trình đơn hàng</h2>
              <ol className="mt-4 space-y-4 border-l border-rule pl-4 text-[13px]">
                {timeline.map((entry) => (
                  <li key={entry.label}>
                    <p className="font-medium">{entry.label}</p>
                    <p className="mt-1 text-[12px] text-muted">
                      {formatOrderDate(entry.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </Container>
    </StorefrontShell>
  );
}

function OrderDetailFallback() {
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
