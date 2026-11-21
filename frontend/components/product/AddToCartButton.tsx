'use client';

import { useCart } from '@/context/CartContext';
import type { StorefrontProduct } from '@/types';

export function AddToCartButton({
  product,
  className = '',
  label = 'Thêm vào giỏ',
}: {
  product: StorefrontProduct;
  className?: string;
  label?: string;
}) {
  const { addToCart } = useCart();

  if (!product.inStock) {
    return (
      <button
        type="button"
        disabled
        className={`border border-rule py-2 text-[12px] font-semibold text-muted ${className}`}
      >
        Hết hàng
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addToCart(product)}
      className={`border border-rule py-2 text-[12px] font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-paper ${className}`}
    >
      {label}
    </button>
  );
}
