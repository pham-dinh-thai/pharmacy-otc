import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { displayName, fetchCurrentUser } from '@/lib/account';
import {
  createCheckout,
  fetchCheckoutForConfirmation,
} from '@/lib/checkout';
import { fetchDeliveryContact } from '@/lib/delivery-contact';
import { safeNextPath } from '@/lib/session';
import { fetchStorefrontCategories } from '@/lib/storefront';
import { formatVND } from '@/lib/utils';
import type { CheckoutDetailResponse, PaymentMethod } from '@/types';
import { confirmCheckoutAction, updateCheckoutAction } from './actions';

export const metadata = {
  title: 'Thanh toán | PharmaOTC',
};

type SearchParams = {
  item?: string | string[];
  edit?: string | string[];
  confirm?: string | string[];
  error?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

const ERROR_MESSAGES: Record<string, string> = {
  cart: 'Giỏ hàng đã thay đổi. Vui lòng kiểm tra lại sản phẩm đã chọn.',
  missing: 'Vui lòng điền đầy đủ thông tin và chọn phương thức thanh toán.',
  server: 'Không tạo được thông tin thanh toán. Vui lòng thử lại.',
};

const EDIT_ERROR_MESSAGES: Record<string, string> = {
  checkout: 'Không tìm thấy thông tin thanh toán. Vui lòng bắt đầu lại từ giỏ hàng.',
  expired:
    'Thông tin thanh toán đã hết hạn sau 30 phút. Vui lòng tạo lại từ giỏ hàng.',
  missing: 'Vui lòng điền đầy đủ thông tin và chọn phương thức thanh toán.',
  status: 'Thông tin thanh toán này đã được xử lý. Vui lòng kiểm tra lại.',
  server: 'Không cập nhật được thông tin. Vui lòng thử lại.',
};

const CONFIRM_ERROR_MESSAGES: Record<string, string> = {
  checkout: 'Không tìm thấy thông tin thanh toán. Vui lòng bắt đầu lại từ giỏ hàng.',
  expired:
    'Thông tin thanh toán đã hết hạn sau 30 phút. Vui lòng tạo lại từ giỏ hàng.',
  status: 'Thông tin thanh toán này đã được xử lý. Vui lòng kiểm tra lại.',
  stock: 'Một số sản phẩm đã hết hàng. Vui lòng kiểm tra lại giỏ hàng.',
  server: 'Không xác nhận được đơn hàng. Vui lòng thử lại.',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  sepay: 'SePay — Chuyển khoản ngân hàng',
  zalopay: 'ZaloPay',
  vietqr: 'VietQR',
};

const PAYMENT_METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

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
  const editId = normalizeIds(params.edit)[0] ?? '';
  const confirmId = normalizeIds(params.confirm)[0] ?? '';
  const isEditStep = Boolean(editId);
  const isConfirmStep = Boolean(confirmId);
  const categories = await fetchStorefrontCategories();
  const user = await fetchCurrentUser();

  if (!user) {
    const nextPath = isConfirmStep
      ? `/checkout?confirm=${encodeURIComponent(confirmId)}`
      : isEditStep
        ? `/checkout?edit=${encodeURIComponent(editId)}`
        : `/checkout${toQuery(selectedIds)}`;
    const next = safeNextPath(nextPath) ?? '/checkout';
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  let content: React.ReactNode;

  if (isConfirmStep) {
    const result = UUID_PATTERN.test(confirmId)
      ? await fetchCheckoutForConfirmation(confirmId)
      : { error: 'checkout' as const };

    content = result.checkout ? (
      <ConfirmPanel
        checkout={result.checkout}
        errorMessage={confirmError(params.error)}
      />
    ) : (
      <CheckoutProblem
        checkoutId={confirmId}
        errorMessage={confirmError(result.error)}
      />
    );
  } else if (isEditStep) {
    const result = UUID_PATTERN.test(editId)
      ? await fetchCheckoutForConfirmation(editId)
      : { error: 'checkout' as const };

    content = result.checkout ? (
      <CheckoutEditForm
        checkout={result.checkout}
        errorMessage={editError(params.error)}
      />
    ) : (
      <CheckoutProblem
        checkoutId={editId}
        errorMessage={editError(result.error)}
      />
    );
  } else if (selectedIds.length === 0) {
    content = params.error ? (
      <CheckoutProblem errorMessage={checkoutError(params.error)} />
    ) : (
      <EmptySelection />
    );
  } else {
    const deliveryContact = await fetchDeliveryContact();
    const result = await createCheckout(
      selectedIds,
      displayName(user),
      deliveryContact.address ?? '',
      deliveryContact.phone ?? '',
    );

    if ('error' in result) {
      redirect(`/checkout?error=${result.error}`);
    }

    redirect(`/checkout?edit=${encodeURIComponent(result.id)}`);
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
            {isConfirmStep ? 'Xác nhận' : isEditStep ? 'Cập nhật' : 'Thanh toán'}
          </span>
        </nav>

        <div className="mt-5 border-b border-rule pb-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
            {isConfirmStep
              ? 'Xác nhận đơn hàng'
              : isEditStep
                ? 'Cập nhật thông tin thanh toán'
                : 'Thông tin thanh toán'}
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            {isConfirmStep
              ? 'Kiểm tra thông tin giao hàng và sản phẩm trước khi xác nhận.'
              : isEditStep
                ? 'Chỉnh sửa thông tin giao hàng và phương thức thanh toán, sau đó tiếp tục xác nhận.'
                : 'Đang tạo thông tin thanh toán từ các sản phẩm đã chọn.'}
          </p>
        </div>

        {content}
      </Container>
    </StorefrontShell>
  );
}

function CheckoutEditForm({
  checkout,
  errorMessage,
}: {
  checkout: CheckoutDetailResponse;
  errorMessage?: string;
}) {
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <form action={updateCheckoutAction} className="space-y-6">
        <input type="hidden" name="checkoutId" value={checkout.id} />

        <section aria-label="Thông tin giao hàng">
          <h2 className="border-b border-rule pb-3 text-[15px] font-semibold">
            Thông tin giao hàng
          </h2>

          <div className="mt-5">
            <FormMessage message={errorMessage} />
          </div>

          <p className="mt-3 text-[12px] text-muted">
            Thông tin thanh toán này hết hạn lúc{' '}
            <span className="tabular-nums">
              {new Date(checkout.expiresAt).toLocaleString('vi-VN')}
            </span>
            . Bạn có thể chỉnh sửa cho lần đặt này.
          </p>

          <div className="mt-5 grid gap-5">
            <label className={LABEL_CLASS}>
              Họ tên người nhận
              <input
                name="shippingName"
                type="text"
                autoComplete="name"
                defaultValue={checkout.shippingName}
                required
                maxLength={255}
                className={INPUT_CLASS}
              />
            </label>

            <label className={LABEL_CLASS}>
              Số điện thoại
              <input
                name="shippingPhone"
                type="tel"
                autoComplete="tel"
                defaultValue={checkout.shippingPhone}
                required
                maxLength={20}
                className={INPUT_CLASS}
              />
            </label>

            <label className={LABEL_CLASS}>
              Địa chỉ giao hàng
              <textarea
                name="shippingAddress"
                defaultValue={checkout.shippingAddress}
                required
                maxLength={500}
                rows={3}
                className={`${INPUT_CLASS} resize-y`}
              />
            </label>

            <label className={LABEL_CLASS}>
              Phương thức thanh toán
              <select
                name="paymentMethod"
                defaultValue={checkout.paymentMethod}
                required
                className={INPUT_CLASS}
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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

      <CheckoutSummary checkout={checkout} />
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
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <form action={confirmCheckoutAction} className="space-y-6">
        <input type="hidden" name="checkoutId" value={checkout.id} />
        <input type="hidden" name="paymentMethod" value={checkout.paymentMethod} />

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
            <div className="flex gap-4">
              <dt className="w-32 shrink-0 text-muted">Thanh toán</dt>
              <dd>{PAYMENT_METHOD_LABELS[checkout.paymentMethod]}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-6">
          <button
            type="submit"
            className="border border-ink bg-ink px-6 py-3 text-[13px] font-semibold text-paper hover:bg-accent"
          >
            Xác nhận
          </button>
          <Link
            href={`/checkout?edit=${encodeURIComponent(checkout.id)}`}
            className="text-[13px] text-muted underline decoration-rule underline-offset-4 hover:text-accent"
          >
            Sửa thông tin
          </Link>
        </div>
      </form>

      <CheckoutSummary checkout={checkout} />
    </div>
  );
}

function CheckoutSummary({ checkout }: { checkout: CheckoutDetailResponse }) {
  const total = Number(checkout.amount);

  return (
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
  );
}

function CheckoutProblem({
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

function EmptySelection() {
  return (
    <div className="mt-8 max-w-2xl border border-rule p-6">
      <p className="text-[14px] font-semibold">Chưa có sản phẩm nào được chọn.</p>
      <p className="mt-2 text-[13px] text-muted">
        Quay lại giỏ hàng và tick vào sản phẩm bạn muốn mua.
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

function checkoutError(code?: string): string | undefined {
  return code ? ERROR_MESSAGES[code] ?? ERROR_MESSAGES.server : undefined;
}

function editError(code?: string): string | undefined {
  return code ? EDIT_ERROR_MESSAGES[code] ?? EDIT_ERROR_MESSAGES.server : undefined;
}

function confirmError(code?: string): string | undefined {
  return code
    ? CONFIRM_ERROR_MESSAGES[code] ?? CONFIRM_ERROR_MESSAGES.server
    : undefined;
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
