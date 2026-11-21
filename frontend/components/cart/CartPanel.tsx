'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CartSkeleton } from './CartSkeleton';
import { useCart } from '@/context/CartContext';
import { MAX_CART_ITEMS } from '@/lib/cart';
import { formatVND } from '@/lib/utils';

export function CartPanel() {
  const {
    items,
    isLoading,
    error,
    totalItems,
    subtotal,
    shippingFee,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (isLoading) return <CartSkeleton />;

  if (error) {
    return (
      <div className="border border-rule px-6 py-16 text-center">
        <p className="text-[15px] font-semibold">Không tải được giỏ hàng.</p>
        <p className="mt-2 text-[13px] text-muted">{error}</p>
        <Link
          href="/catalog"
          className="mt-5 inline-block border border-ink px-5 py-2.5 text-[13px] font-semibold text-paper hover:bg-ink"
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-rule px-6 py-20 text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid h-12 w-12 place-items-center bg-accent-soft text-[24px] leading-none text-accent"
        >
          +
        </span>
        <p className="mt-5 text-[20px] font-bold tracking-[-0.02em]">
          Giỏ hàng đang trống
        </p>
        <p className="mt-2 text-[13px] text-muted">
          Chọn sản phẩm rồi quay lại đây để xem đơn hàng của bạn.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-block border border-ink bg-ink px-6 py-3 text-[13px] font-semibold text-paper hover:bg-accent"
        >
          Xem tất cả sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <section aria-label="Sản phẩm trong giỏ hàng">
        <div className="flex items-baseline justify-between border-b border-rule pb-4 text-[13px] text-muted">
          <span>{items.length} sản phẩm</span>
          <span className="tabular-nums">
            {totalItems}/{MAX_CART_ITEMS} sản phẩm
          </span>
        </div>

        <ul>
          {items.map(({ product, quantity, lineTotal }) => (
            <li
              key={product.id}
              className="flex gap-4 border-b border-rule py-6 sm:gap-6"
            >
              <Link
                href={`/product/${product.id}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden bg-surface sm:h-28 sm:w-28"
              >
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-[11px] text-muted">
                    —
                  </span>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${product.id}`}
                      className="text-[15px] font-semibold leading-5 hover:text-accent"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-[12px] text-muted">
                      {[product.sku, product.unit].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="tabular-nums text-[15px] font-semibold">
                    {formatVND(lineTotal)}
                  </span>
                </div>

                {!product.inStock ? (
                  <p className="mt-2 text-[12px] text-muted">Hết hàng</p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                  <div className="flex items-center border border-rule">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${product.name}`}
                      onClick={() => {
                        void updateQuantity(product.id, quantity - 1);
                      }}
                      className="px-3 py-1.5 text-[13px] hover:bg-surface"
                    >
                      −
                    </button>
                    <span className="tabular-nums w-8 text-center text-[13px]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${product.name}`}
                      disabled={totalItems >= MAX_CART_ITEMS}
                      onClick={() => {
                        void updateQuantity(product.id, quantity + 1);
                      }}
                      className="px-3 py-1.5 text-[13px] hover:bg-surface disabled:cursor-not-allowed disabled:text-muted/50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void removeFromCart(product.id);
                    }}
                    className="text-[12px] text-muted underline decoration-rule underline-offset-4 hover:text-ink"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            void clearCart();
          }}
          className="mt-5 text-[12px] text-muted underline decoration-rule underline-offset-4 hover:text-ink"
        >
          Xóa toàn bộ giỏ hàng
        </button>
      </section>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="border border-rule p-6">
          <h2 className="text-[15px] font-semibold">Tóm tắt đơn hàng</h2>

          <dl className="mt-6 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="tabular-nums">{formatVND(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd className="tabular-nums">
                {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-baseline justify-between border-t border-rule pt-5">
            <span className="text-[13px] font-semibold">Tổng cộng</span>
            <span className="tabular-nums text-[20px] font-bold tracking-[-0.02em]">
              {formatVND(total)}
            </span>
          </div>

          <Link
            href="/catalog"
            className="mt-6 block border border-ink py-3 text-center text-[13px] font-semibold hover:bg-ink hover:text-paper"
          >
            Tiếp tục mua sắm
          </Link>
          <p className="mt-3 text-[12px] leading-5 text-muted">
            Chưa hỗ trợ thanh toán trực tuyến.
          </p>
        </div>
      </aside>
    </div>
  );
}
