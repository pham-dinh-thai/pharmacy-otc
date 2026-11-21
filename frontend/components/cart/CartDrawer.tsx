'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatVND } from '@/lib/utils';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, subtotal } =
    useCart();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCart();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Giỏ hàng"
      className="fixed inset-0 z-50"
    >
      <button
        type="button"
        aria-label="Đóng giỏ hàng"
        onClick={closeCart}
        className="absolute inset-0 bg-ink/25"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-rule bg-paper">
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 className="text-[15px] font-semibold">
            Giỏ hàng ({items.length})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="text-[13px] text-muted hover:text-ink"
          >
            Đóng
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-3 px-5">
            <p className="text-[14px]">Giỏ hàng đang trống.</p>
            <button
              type="button"
              onClick={closeCart}
              className="text-[13px] underline decoration-rule underline-offset-4 hover:text-accent"
            >
              Tiếp tục xem sản phẩm
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto overscroll-contain">
              {items.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex gap-4 border-b border-rule px-5 py-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-surface">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-[10px] text-muted">
                        —
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-5">
                      {product.name}
                    </p>
                    <p className="text-[12px] text-muted">{product.unit}</p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center border border-rule">
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${product.name}`}
                          onClick={() =>
                            updateQuantity(product.id, quantity - 1)
                          }
                          className="px-2.5 py-1 text-[13px] hover:bg-surface"
                        >
                          −
                        </button>
                        <span className="tabular-nums w-7 text-center text-[13px]">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${product.name}`}
                          onClick={() =>
                            updateQuantity(product.id, quantity + 1)
                          }
                          className="px-2.5 py-1 text-[13px] hover:bg-surface"
                        >
                          +
                        </button>
                      </div>

                      <span className="tabular-nums text-[13px] font-semibold">
                        {formatVND(product.unitPrice * quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      className="mt-2 text-[12px] text-muted underline decoration-rule underline-offset-4 hover:text-ink"
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-rule px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-muted">Tạm tính</span>
                <span className="tabular-nums text-[17px] font-semibold">
                  {formatVND(subtotal)}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-muted">
                Chưa hỗ trợ thanh toán trực tuyến.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
