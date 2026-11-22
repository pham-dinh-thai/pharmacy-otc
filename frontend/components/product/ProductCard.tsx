'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatVND } from '@/lib/utils';
import type { StorefrontProduct } from '@/types';
import { AddToCartButton } from './AddToCartButton';

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const detailHref = `/product/${product.id}`;

  return (
    <article className="flex flex-col">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full place-items-center text-[13px] text-muted">
              Chưa có ảnh
            </span>
          )}
        </div>
      </Link>

      <p className="mt-4 text-[12px] text-muted">
        {product.categories[0]?.name ?? 'Sản phẩm'}
      </p>

      <h3 className="mt-1 text-[15px] font-semibold leading-6">
        <Link href={detailHref} className="hover:text-accent">
          {product.name}
        </Link>
      </h3>

      {product.description ? (
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted">
          {product.description}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="flex items-baseline justify-between gap-3 border-t border-rule pt-3">
          <p className="tabular-nums text-[15px] font-semibold">
            {formatVND(product.unitPrice)}
          </p>
          <p className="text-[12px] text-muted">{product.unit ?? '—'}</p>
        </div>

        <AddToCartButton product={product} className="mt-3 w-full" />
      </div>
    </article>
  );
}
