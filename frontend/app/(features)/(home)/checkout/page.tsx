import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CartSync } from '@/components/cart/CartSync';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { displayName, fetchCurrentUser } from '@/lib/account';
import { fetchCartAction } from '@/lib/cart-actions';
import { fetchCheckoutForConfirmation } from '@/lib/checkout';
import { fetchDeliveryContact } from '@/lib/delivery-contact';
import { safeNextPath } from '@/lib/session';
import { fetchStorefrontCategories } from '@/lib/storefront';
import { formatVND } from '@/lib/utils';
import type { CartItemResponse, CheckoutDetailResponse } from '@/types';
import { confirmCheckoutAction, createCheckoutAction } from './actions';

export const metadata = {
  title: 'Thanh toán | PharmaOTC',
};

type SearchParams = {
  item?: string | string[];
  error?: string;
  confirm?: string | string[];
  done?: string;
  id?: string;
  order?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Vui lòng điền đầy đủ thông tin giao hàng.',
  cart: 'Giỏ hàng đã thay đổi. Vui lòng kiểm tra lại sản phẩm đã chọn.',
  server: 'Không tạo được thông tin thanh toán. Vui lòng thử lại.',
};

const CONFIRM_ERROR_MESSAGES: Record<string, string> = {
  checkout: 'Không tìm thấy thông tin thanh toán. Vui lòng bắt đầu lại từ giỏ hàng.',
  expired:
    'Thông tin thanh toán đã hết hạn sau 30 phút. Vui lòng tạo lại từ giỏ hàng.',
  status: 'Thông tin thanh toán này đã được xử lý. Vui lòng kiểm tra lại.',
  stock: 'Một số sản phẩm đã hết hàng. Vui lòng kiểm tra lại giỏ hàng.',
  server: 'Không xác nhận được đơn hàng. Vui lòng thử lại.',
};

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutRoute searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckoutRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedIds = normalizeIds(params.item);
  const confirmId = normalizeIds(params.confirm)[0] ?? '';
  const isConfirmStep = Boolean(confirmId);
  const isDoneStep = Boolean(params.done);
  const categories = await fetchStorefrontCategories();
  const user = await fetchCurrentUser();

  if (!user) {
    const nextPath = isConfirmStep
      ? `/checkout?confirm=${encodeURIComponent(confirmId)}`
      : `/checkout${toQuery(selectedIds)}`;
    const next = safeNextPath(nextPath) ?? '/checkout';
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  let content: React.ReactNode;

  if (isDoneStep) {
    content = <DonePanel checkoutId={params.id} orderId={params.order} />;
  } else if (isConfirmStep) {
    const result = UUID_PATTERN.test(confirmId)
      ? await fetchCheckoutForConfirmation(confirmId)
      : { error: 'checkout' as const };

    content = result.checkout ? (
      <ConfirmPanel
        checkout={result.checkout}
        errorMessage={confirmErrorMessage(params.error)}
      />
    ) : (
      <ConfirmProblem
        checkoutId={confirmId}
        errorMessage={confirmErrorMessage(result.error)}
      />
    );
  } else if (selectedIds.length === 0) {
    content = <EmptySelection />;
  } else {
    const [cart, deliveryContact] = await Promise.all([
      fetchCartAction(),
      fetchDeliveryContact(),
    ]);
    const items = selectedIds.flatMap((id) => {
      const item = cart.items.find((entry) => entry.product.id === id);
      return item ? [item] : [];
    });

    content =
      items.length === 0 ? (
        <EmptySelection changed />
      ) : (
        <CheckoutForm
          items={items}
          selectedIds={selectedIds}
          defaultName={displayName(user)}
          defaultPhone={deliveryContact.phone ?? ''}
          defaultAddress={deliveryContact.address ?? ''}
          errorMessage={errorMessage(params.error)}
        />
      );
  }

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
          <Link href="/cart" className="hover:text-accent">
            Giỏ hàng
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">
            {isDoneStep ? 'Hoàn tất' : isConfirmStep ? 'Xác nhận' : 'Thanh toán'}
          </span>
        </nav>

        <div className="mt-5 border-b border-rule pb-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
            {isDoneStep
              ? 'Đặt hàng thành công'
              : isConfirmStep
                ? 'Xác nhận đơn hàng'
                : 'Thông tin thanh toán'}
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            {isDoneStep
              ? 'Đơn hàng đã được tạo, các sản phẩm đã mua đã được trừ khỏi giỏ.'
              : isConfirmStep
                ? 'Kiểm tra thông tin giao hàng và sản phẩm trước khi xác nhận.'
                : 'Kiểm tra sản phẩm và điền thông tin giao hàng trước khi xác nhận.'}
          </p>
        </div>

        {content}
      </Container>
    </StorefrontShell>
  );
}

function CheckoutForm({
  items,
  selectedIds,
  defaultName,
  defaultPhone,
  defaultAddress,
  errorMessage,
}: {
  items: CartItemResponse[];
  selectedIds: string[];
  defaultName: string;
  defaultPhone: string;
  defaultAddress: string;
  errorMessage?: string;
}) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.lineTotal),
    0,
  );

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <form action={createCheckoutAction} className="space-y-6">
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name="productIds" value={id} />
        ))}

        <section aria-label="Thông tin giao hàng">
          <h2 className="border-b border-rule pb-3 text-[15px] font-semibold">
            Thông tin giao hàng
          </h2>

          <FormMessage message={errorMessage} />

          <p className="mt-3 text-[12px] text-muted">
            Số điện thoại/địa chỉ đã lưu tại{' '}
            <Link href="/account" className="underline underline-offset-4">
              Tài khoản
            </Link>{' '}
            được điền sẵn. Bạn có thể sửa cho lần đặt này.
          </p>

          <div className="mt-5 grid gap-5">
            <label className={LABEL_CLASS}>
              Họ tên người nhận
              <input
                name="shippingName"
                type="text"
                autoComplete="name"
                defaultValue={defaultName}
                required
                maxLength={255}
                className={INPUT_CLASS}
                placeholder="Nguyễn Văn A"
              />
            </label>

            <label className={LABEL_CLASS}>
              Số điện thoại
              <input
                name="shippingPhone"
                type="tel"
                autoComplete="tel"
                defaultValue={defaultPhone}
                required
                maxLength={20}
                className={INPUT_CLASS}
                placeholder="0901234567"
              />
            </label>

            <label className={LABEL_CLASS}>
              Địa chỉ giao hàng
              <textarea
                name="shippingAddress"
                defaultValue={defaultAddress}
                required
                maxLength={500}
                rows={3}
                className={`${INPUT_CLASS} resize-y`}
                placeholder="Số nhà, tên đường, phường/quận, thành phố"
              />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-6">
          <button
            type="submit"
            className="border border-ink bg-ink px-6 py-3 text-[13px] font-semibold text-paper hover:bg-accent"
          >
            Tiếp tục xác nhận
          </button>
          <Link
            href="/cart"
            className="text-[13px] text-muted underline decoration-rule underline-offset-4 hover:text-accent"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </form>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="border border-rule p-6">
          <h2 className="text-[15px] font-semibold">Sản phẩm đã chọn</h2>
          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <li
                key={item.product.id}
                className="flex justify-between gap-4 border-b border-rule pb-4 text-[13px] last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium leading-5">{item.product.name}</p>
                  <p className="mt-1 text-muted">
                    {formatVND(Number(item.product.unitPrice))} × {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums font-semibold">
                  {formatVND(Number(item.lineTotal))}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="tabular-nums">{formatVND(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd>Tính khi xác nhận</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function ConfirmPanel({
  checkout,
  errorMessage,
}: {
  checkout: CheckoutDetailResponse;
  errorMessage?: string;
}) {
  const total = Number(checkout.amount);

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <form action={confirmCheckoutAction} className="space-y-6">
        <input type="hidden" name="checkoutId" value={checkout.id} />

        <section aria-label="Thông tin xác nhận">
          <h2 className="border-b border-rule pb-3 text-[15px] font-semibold">
            Thông tin giao hàng
          </h2>

          <div className="mt-5">
            <FormMessage message={errorMessage} />
          </div>

          <p className="mt-3 text-[12px] text-muted">
            Bấm xác nhận sẽ tạo đơn hàng và trừ kho ngay. Thông tin thanh toán
            này hết hạn lúc{' '}
            <span className="tabular-nums">
              {new Date(checkout.expiresAt).toLocaleString('vi-VN')}
            </span>
            .
          </p>

          <dl className="mt-5 space-y-3 text-[13px]">
            <div className="flex gap-4">
              <dt className="w-32 shrink-0 text-muted">Người nhận</dt>
              <dd className="font-medium">{checkout.shippingName}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-32 shrink-0 text-muted">Số điện thoại</dt>
              <dd className="tabular-nums">{checkout.shippingPhone}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-32 shrink-0 text-muted">Địa chỉ</dt>
              <dd>{checkout.shippingAddress}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-6">
          <button
            type="submit"
            className="border border-ink bg-ink px-6 py-3 text-[13px] font-semibold text-paper hover:bg-accent"
          >
            Xác nhận đặt hàng
          </button>
          <Link
            href="/cart"
            className="text-[13px] text-muted underline decoration-rule underline-offset-4 hover:text-accent"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </form>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="border border-rule p-6">
          <h2 className="text-[15px] font-semibold">Sản phẩm đã chọn</h2>
          <ul className="mt-4 space-y-4">
            {checkout.lines.map((line) => (
              <li
                key={line.productId}
                className="flex justify-between gap-4 border-b border-rule pb-4 text-[13px] last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium leading-5">{line.productName}</p>
                  <p className="mt-1 text-muted">
                    {line.productSku ? `${line.productSku} · ` : ''}
                    {formatVND(Number(line.unitPrice))} × {line.quantity}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums font-semibold">
                  {formatVND(Number(line.lineTotal))}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="tabular-nums">{formatVND(total)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd>Miễn phí</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-rule pt-3 text-[15px] font-semibold">
              <dt>Tổng thanh toán</dt>
              <dd className="tabular-nums">{formatVND(total)}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function ConfirmProblem({
  checkoutId,
  errorMessage,
}: {
  checkoutId?: string;
  errorMessage?: string;
}) {
  return (
    <div className="mt-8 max-w-2xl border border-rule p-6">
      <FormMessage message={errorMessage} />
      {checkoutId ? (
        <p className="text-[12px] text-muted">
          Mã thanh toán: <span className="tabular-nums">{checkoutId}</span>
        </p>
      ) : null}
      <Link
        href="/cart"
        className="mt-5 inline-block border border-ink bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper hover:bg-accent"
      >
        Về giỏ hàng
      </Link>
    </div>
  );
}

function DonePanel({
  checkoutId,
  orderId,
}: {
  checkoutId?: string;
  orderId?: string;
}) {
  return (
    <div className="mt-8 max-w-2xl border border-rule p-6">
      <CartSync />
      <FormMessage
        tone="success"
        message="Đơn hàng đã được xác nhận. Hàng tồn kho đã được trừ theo lô hết hạn sớm nhất; các sản phẩm đã mua đã được xóa khỏi giỏ."
      />
      <dl className="space-y-2 text-[13px]">
        {orderId ? (
          <div className="flex gap-4">
            <dt className="w-28 shrink-0 text-muted">Mã đơn hàng</dt>
            <dd className="tabular-nums font-semibold">{orderId}</dd>
          </div>
        ) : null}
        {checkoutId ? (
          <div className="flex gap-4">
            <dt className="w-28 shrink-0 text-muted">Mã thanh toán</dt>
            <dd className="tabular-nums">{checkoutId}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/catalog"
          className="border border-ink bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper hover:bg-accent"
        >
          Tiếp tục mua sắm
        </Link>
        <Link
          href="/orders"
          className="border border-rule px-5 py-2.5 text-[13px] font-semibold hover:border-ink"
        >
          Xem đơn hàng của tôi
        </Link>
        <Link
          href="/cart"
          className="border border-rule px-5 py-2.5 text-[13px] font-semibold hover:border-ink"
        >
          Xem giỏ hàng
        </Link>
      </div>
    </div>
  );
}

function EmptySelection({ changed = false }: { changed?: boolean }) {
  return (
    <div className="mt-8 max-w-2xl border border-rule p-6">
      <p className="text-[14px] font-semibold">
        {changed
          ? 'Sản phẩm đã chọn không còn trong giỏ hàng.'
          : 'Chưa có sản phẩm nào được chọn.'}
      </p>
      <p className="mt-2 text-[13px] text-muted">
        {changed
          ? 'Giỏ hàng có thể đã thay đổi. Vui lòng chọn lại sản phẩm.'
          : 'Quay lại giỏ hàng và tick vào sản phẩm bạn muốn mua.'}
      </p>
      <Link
        href="/cart"
        className="mt-5 inline-block border border-ink bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper hover:bg-accent"
      >
        Về giỏ hàng
      </Link>
    </div>
  );
}

function normalizeIds(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];

  return [
    ...new Set(
      raw
        .flatMap((entry) => entry.split(','))
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];
}

function toQuery(ids: string[]): string {
  const params = new URLSearchParams();
  for (const id of ids) params.append('item', id);

  const query = params.toString();
  return query ? `?${query}` : '';
}

function errorMessage(code?: string): string | undefined {
  if (!code) return undefined;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.server;
}

function confirmErrorMessage(code?: string): string | undefined {
  if (!code) return undefined;
  return CONFIRM_ERROR_MESSAGES[code] ?? CONFIRM_ERROR_MESSAGES.server;
}

function CheckoutFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-rule" />
      <Container className="py-8 lg:py-10">
        <div className="h-3 w-48 bg-surface" />
        <div className="mt-5 border-b border-rule pb-6">
          <div className="h-8 w-56 bg-surface" />
          <div className="mt-2 h-4 w-72 bg-surface" />
        </div>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-72 border border-rule bg-surface/40" />
          <div className="h-52 border border-rule bg-surface/40" />
        </div>
      </Container>
    </div>
  );
}
