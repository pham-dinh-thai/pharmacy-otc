import { Suspense } from 'react';
import Link from 'next/link';
import { CartClient } from '@/components/cart/CartClient';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { fetchStorefrontCategories } from '@/lib/storefront';

export const metadata = {
  title: 'Giỏ hàng | PharmaOTC',
};

export default function CartPage() {
  return (
    <Suspense fallback={<CartPageFallback />}>
      <CartRoute />
    </Suspense>
  );
}

async function CartRoute() {
  const categories = await fetchStorefrontCategories();

  return (
    <StorefrontShell categories={categories}>
      <Container className="pt-8 pb-0 lg:pt-10 lg:pb-0">
        <nav
          aria-label="Đường dẫn"
          className="flex items-center gap-2 text-[12px] text-muted"
        >
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">Giỏ hàng</span>
        </nav>

        <div className="mt-5 border-b border-rule pb-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
            Giỏ hàng
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            Kiểm tra sản phẩm và số lượng trước khi thanh toán.
          </p>
        </div>

        <CartClient />
      </Container>
    </StorefrontShell>
  );
}

function CartPageFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-rule" />
      <Container className="py-8 lg:py-10">
        <div className="h-3 w-28 bg-surface" />
        <div className="mt-5 border-b border-rule pb-6">
          <div className="h-8 w-40 bg-surface" />
          <div className="mt-2 h-4 w-56 bg-surface" />
        </div>
      </Container>
    </div>
  );
}
