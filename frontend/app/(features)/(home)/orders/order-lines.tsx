'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { OrderLine } from '@/lib/orders';
import { formatVND } from '@/lib/utils';
import { ProductThumb } from './product-thumb';

const PREVIEW_COUNT = 2;

export function OrderLines({ lines }: { lines: OrderLine[] }) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = lines.length - PREVIEW_COUNT;
  const visibleLines = expanded ? lines : lines.slice(0, PREVIEW_COUNT);

  return (
    <ul className="space-y-4 px-7 pt-1">
      {visibleLines.map((line) => (
        <li key={line.productId} className="flex gap-4">
          <ProductThumb line={line} />
          <div className="min-w-0 flex-1">
            <Link
              href={`/product/${line.productId}`}
              className="line-clamp-2 text-[13px] font-medium leading-5 hover:text-accent"
            >
              {line.productName}
            </Link>
            <p className="mt-1 text-[12px] text-muted">
              {line.productSku ? `Mã: ${line.productSku} · ` : ''}x
              {line.quantity}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[13px] font-semibold tabular-nums">
              {formatVND(Number(line.unitPrice))}
            </p>
            <p className="mt-1 text-[12px] tabular-nums text-muted">
              {formatVND(Number(line.lineTotal))}
            </p>
          </div>
        </li>
      ))}

      {hiddenCount > 0 && (
        <li>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            className="text-[12px] font-medium text-accent hover:underline"
          >
            {expanded
              ? 'Thu gọn'
              : `Xem thêm ${hiddenCount} sản phẩm trong đơn ↓`}
          </button>
        </li>
      )}
    </ul>
  );
}
