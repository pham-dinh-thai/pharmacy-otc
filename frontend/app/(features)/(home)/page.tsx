import { Suspense } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { HeaderAuth } from '@/components/layout/HeaderAuth';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Hero } from '@/components/home/Hero';
import { Catalog, CatalogFallback } from '@/components/home/Catalog';
import { CATEGORIES } from '@/data/mock-data';
import type { ProductCategory } from '@/types';

const SHORT_NAMES: Record<ProductCategory, string> = {
  otc_medicine: 'Thuốc',
  supplement: 'Thực phẩm chức năng',
  cosmetics: 'Dược mỹ phẩm',
  medical_device: 'Thiết bị y tế',
};

const NAV_CATEGORIES = CATEGORIES.map((category) => ({
  id: category.id,
  name: category.name,
  shortName: SHORT_NAMES[category.id],
}));

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; 'danh-muc'?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:text-paper"
      >
        Bỏ qua điều hướng
      </a>

      <SiteHeader
        categories={NAV_CATEGORIES}
        authSlot={
          <Suspense fallback={<span className="text-muted">Đăng nhập</span>}>
            <HeaderAuth />
          </Suspense>
        }
      />

      <main id="main" className="flex-1">
        <Hero />

        <Suspense fallback={<CatalogFallback />}>
          <Catalog searchParams={searchParams} />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
