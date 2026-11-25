'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CartSkeleton } from './CartSkeleton';
import { useCart } from '@/context/CartContext';
import { Container } from '@/components/layout/Container';
import { MAX_CART_ITEMS } from '@/lib/cart';
import { formatVND } from '@/lib/utils';

export function CartPanel() {
  const {
    items,
    isLoading,
    error,
    totalItems,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const router = useRouter();

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

  // New items are selected by default; deselections survive cart updates.
  const selectedItems = items.filter(
    ({ product }) => !deselectedIds.has(product.id),
  );
  const allSelected = selectedItems.length === items.length;
  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );

  const toggleProduct = (productId: string) => {
    setDeselectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setDeselectedIds(
      allSelected ? new Set(items.map(({ product }) => product.id)) : new Set(),
    );
  };

  const goToCheckout = () => {
    const params = new URLSearchParams();
    for (const { product } of selectedItems) params.append('item', product.id);
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <section aria-label="Sản phẩm trong giỏ hàng">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4 text-[13px] text-muted">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Chọn tất cả sản phẩm"
                className="h-4 w-4 cursor-pointer accent-accent"
              />
              <span>{allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
            </label>
            <span className="tabular-nums">
              {items.length} sản phẩm · {totalItems}/{MAX_CART_ITEMS}
            </span>
          </div>

          <ul>
            {items.map(({ product, quantity, lineTotal }) => (
              <li
                key={product.id}
                className="flex gap-4 border-b border-rule py-6 sm:gap-6"
              >
                <input
                  type="checkbox"
                  checked={!deselectedIds.has(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  aria-label={`Chọn ${product.name} để mua`}
                  className="mt-9 h-5 w-5 shrink-0 cursor-pointer accent-accent sm:mt-11"
                />

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
            <h2 className="text-[15px] font-semibold">Đơn hàng đã chọn</h2>
            <p className="mt-1 text-[12px] text-muted">
              Chọn sản phẩm để tính vào đơn hàng muốn mua.
            </p>

            <dl className="mt-6 space-y-3 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Số lượng đã chọn</dt>
                <dd className="tabular-nums">{selectedCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Phí giao hàng</dt>
                <dd>Tính khi đặt hàng</dd>
              </div>
            </dl>

            <div className="mt-6 flex items-baseline justify-between border-t border-rule pt-5">
              <span className="text-[13px] font-semibold">
                Tổng giá trị item muốn mua
              </span>
              <span className="tabular-nums text-[20px] font-bold tracking-[-0.02em]">
                {formatVND(selectedSubtotal)}
              </span>
            </div>

            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={goToCheckout}
              className="mt-6 block w-full border border-ink bg-ink py-3 text-center text-[13px] font-semibold text-paper hover:bg-accent disabled:cursor-not-allowed disabled:border-rule disabled:bg-surface disabled:text-muted"
            >
              Mua
            </button>

            <Link
              href="/catalog"
              className="mt-6 block border border-ink py-3 text-center text-[13px] font-semibold hover:bg-ink hover:text-paper"
            >
              Tiếp tục mua sắm
            </Link>
            <p className="mt-3 text-[12px] leading-5 text-muted">
              Tổng giá trị toàn giỏ hàng hiển thị ở thanh dưới cùng.
            </p>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 -mx-5 border-t border-rule bg-paper/95 backdrop-blur sm:-mx-8">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="text-[12px] text-muted">Tổng giá trị giỏ hàng</p>
            <p className="tabular-nums text-[15px] font-semibold">
              {formatVND(total)}
            </p>
          </div>
          <p className="text-[12px] text-muted">
            Đã chọn {selectedCount} sản phẩm · {formatVND(selectedSubtotal)}
          </p>
        </Container>
      </div>
    </>
  );
}
