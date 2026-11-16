'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatVND } from '@/lib/utils';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <article className="flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <p className="mt-4 text-[12px] text-muted">
        {product.subCategory ?? product.categoryName}
      </p>

      <h3 className="mt-1 text-[15px] font-semibold leading-6">
        {product.name}
      </h3>

      {product.activeIngredient ? (
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted">
          {product.activeIngredient}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="flex items-baseline justify-between gap-3 border-t border-rule pt-3">
          <p className="tabular-nums text-[15px] font-semibold">
            {formatVND(product.unitPrice)}
          </p>
          <p className="text-[12px] text-muted">{product.unit}</p>
        </div>

        <button
          type="button"
          onClick={() => addToCart(product)}
          className="mt-3 w-full border border-rule py-2 text-[12px] font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-paper"
        >
          Thêm vào giỏ
        </button>
      </div>
    </article>
  );
}
