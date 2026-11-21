import { Suspense } from 'react';
import { HeaderAuth } from './HeaderAuth';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import type { StorefrontCategory } from '@/types';

/** Shared header/footer for public storefront pages. */
export function StorefrontShell({
  categories,
  children,
}: {
  categories: StorefrontCategory[];
  children: React.ReactNode;
}) {
  const navCategories = categories.map((category) => ({
    ...category,
    shortName: category.name,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:text-paper"
      >
        Bỏ qua điều hướng
      </a>

      <SiteHeader
        categories={navCategories}
        authSlot={
          <Suspense fallback={<span className="text-muted">Đăng nhập</span>}>
            <HeaderAuth />
          </Suspense>
        }
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter categories={categories} />
    </div>
  );
}
