import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { displayName, fetchCurrentUser } from '@/lib/account';
import { fetchCartAction } from '@/lib/cart-actions';
import { fetchDeliveryContact } from '@/lib/delivery-contact';
import { safeNextPath } from '@/lib/session';
import { fetchStorefrontCategories } from '@/lib/storefront';
import { formatVND } from '@/lib/utils';
import type { CartItemResponse } from '@/types';
import { createCheckoutAction } from './actions';

export const metadata = {
  title: 'Thanh toán | PharmaOTC',
};

type SearchParams = {
  item?: string | string[];
  error?: string;
  created?: string;
  id?: string;
};

const LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Vui lòng điền đầy đủ thông tin giao hàng.',
  cart: 'Giỏ hàng đã thay đổi. Vui lòng kiểm tra lại sản phẩm đã chọn.',
  server: 'Không tạo được đơn thanh toán. Vui lòng thử lại.',
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
  const categories = await fetchStorefrontCategories();
  const user = await fetchCurrentUser();

  if (!user) {
    const next = safeNextPath(`/checkout${toQuery(selectedIds)}`) ?? '/checkout';
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const deliveryContact = await fetchDeliveryContact();

  let content: React.ReactNode;

  if (params.created) {
    content = <SuccessPanel id={params.id} />;
  } else if (selectedIds.length === 0) {
    content = <EmptySelection />;
  } else {
    const cart = await fetchCartAction();
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
          <span className="text-ink">Thanh toán</span>
        </nav>

        <div className="mt-5 border-b border-rule pb-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
            Thông tin thanh toán
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            Kiểm tra sản phẩm và điền thông tin giao hàng trước khi xác nhận.
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

function SuccessPanel({ id }: { id?: string }) {
  return (
    <div className="mt-8 max-w-2xl border border-rule p-6">
      <FormMessage
        tone="success"
        message="Đã tạo thông tin thanh toán. Bước xác nhận đơn hàng sẽ được mở tiếp theo."
      />
      {id ? (
        <p className="text-[12px] text-muted">
          Mã thanh toán: <span className="tabular-nums">{id}</span>
        </p>
      ) : null}
      <Link
        href="/catalog"
        className="mt-5 inline-block border border-ink bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper hover:bg-accent"
      >
        Tiếp tục mua sắm
      </Link>
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
