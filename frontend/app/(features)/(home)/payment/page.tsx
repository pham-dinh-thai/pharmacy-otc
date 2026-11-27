import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import { fetchStorefrontCategories } from '@/lib/storefront';
import type { PaymentGatewayResponse, PaymentMethod } from '@/types';
import { SepayCheckoutForm } from './sepay-checkout-form';

export const metadata = {
  title: 'Thanh toán đơn hàng | PharmaOTC',
};

type SearchParams = {
  order?: string | string[];
  checkout?: string | string[];
  method?: string | string[];
};

const PAYMENT_METHOD_LABELS: Partial<Record<PaymentMethod, string>> = {
  sepay: 'SePay — Chuyển khoản ngân hàng',
  zalopay: 'ZaloPay',
  vietqr: 'VietQR',
};

export default function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<div />}>
      <PaymentRoute searchParams={searchParams} />
    </Suspense>
  );
}

async function PaymentRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categories = await fetchStorefrontCategories();
  const user = await fetchCurrentUser();

  if (!user) {
    redirect('/login?next=/payment');
  }

  const orderId = first(params.order);
  const checkoutId = first(params.checkout);
  const method = first(params.method);
  const label = method
    ? PAYMENT_METHOD_LABELS[method as PaymentMethod]
    : undefined;

  const payment =
    orderId && method === 'sepay' ? await fetchGateway(orderId) : null;

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
          <span className="text-ink">Thanh toán</span>
        </nav>

        <div className="mt-5 border-b border-rule pb-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
            Thanh toán đơn hàng
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            Đơn hàng đã được tạo. Hoàn tất thanh toán để cập nhật trạng thái
            đơn.
          </p>
        </div>

        <div className="mt-8 max-w-2xl border border-rule p-6">
          {!orderId || !label ? (
            <FormMessage message="Không xác định được thông tin thanh toán. Vui lòng kiểm tra đơn hàng của bạn." />
          ) : (
            <>
              <dl className="space-y-2 text-[13px]">
                <div className="flex gap-4">
                  <dt className="w-32 shrink-0 text-muted">Mã đơn hàng</dt>
                  <dd className="tabular-nums font-semibold">{orderId}</dd>
                </div>
                {checkoutId ? (
                  <div className="flex gap-4">
                    <dt className="w-32 shrink-0 text-muted">Mã thanh toán</dt>
                    <dd className="tabular-nums">{checkoutId}</dd>
                  </div>
                ) : null}
                <div className="flex gap-4">
                  <dt className="w-32 shrink-0 text-muted">Phương thức</dt>
                  <dd>{label}</dd>
                </div>
              </dl>

              {method === 'sepay' ? (
                payment ? (
                  <SepayCheckoutForm payment={payment} />
                ) : (
                  <FormMessage message="Không lấy được thông tin thanh toán SePay. Vui lòng kiểm tra đơn hàng của bạn." />
                )
              ) : (
                <FormMessage message="Cổng thanh toán này đang được chuẩn bị. Vui lòng quay lại sau." />
              )}
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3 border-t border-rule pt-5">
            <Link
              href="/orders"
              className="border border-rule px-5 py-2.5 text-[13px] font-semibold hover:border-ink"
            >
              Xem đơn hàng của tôi
            </Link>
            <Link
              href="/catalog"
              className="text-[13px] text-muted underline decoration-rule underline-offset-4 hover:text-accent"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </Container>
    </StorefrontShell>
  );
}

async function fetchGateway(
  orderId: string,
): Promise<PaymentGatewayResponse | null> {
  let response: Response;
  try {
    response = await authFetch(
      `/payments/orders/${encodeURIComponent(orderId)}`,
    );
  } catch {
    return null;
  }

  if (response.status === 401) {
    redirect('/login?next=/payment');
  }

  if (!response.ok) return null;

  return (await response.json()) as PaymentGatewayResponse;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}
