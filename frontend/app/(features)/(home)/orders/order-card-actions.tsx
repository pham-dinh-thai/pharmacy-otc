'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cancelOrderAction, reorderOrderAction } from './actions';

export function OrderCardActions({
  orderId,
  returnTo,
  canCancel,
  detailHref,
}: {
  orderId: string;
  returnTo: string;
  canCancel: boolean;
  detailHref?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-4">
      {detailHref && (
        <Link
          href={detailHref}
          className="border border-rule px-4 py-2 text-[12px] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Xem chi tiết
        </Link>
      )}

      {canCancel &&
        (confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-muted">Huỷ đơn này?</span>
            <form action={cancelOrderAction}>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                className="border border-red-600 bg-red-600 px-4 py-2 text-[12px] font-semibold text-paper transition-colors hover:bg-red-700"
              >
                Xác nhận huỷ
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-[12px] text-muted underline decoration-rule underline-offset-4 hover:text-accent"
            >
              Giữ đơn
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="border border-rule px-4 py-2 text-[12px] font-medium text-muted transition-colors hover:border-red-600 hover:text-red-700"
          >
            Huỷ đơn
          </button>
        ))}

      <form action={reorderOrderAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          className="border border-accent bg-accent px-4 py-2 text-[12px] font-semibold text-paper transition-colors hover:bg-[#174636]"
        >
          Mua lại
        </button>
      </form>
    </div>
  );
}
