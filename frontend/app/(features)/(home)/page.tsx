import { Suspense } from 'react';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { Hero } from '@/components/home/Hero';
import { Catalog, CatalogFallback } from '@/components/home/Catalog';
import { fetchStorefrontCategories } from '@/lib/storefront';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const categories = await fetchStorefrontCategories();

  return (
    <StorefrontShell categories={categories}>
      <Hero categories={categories} />

      <Suspense fallback={<CatalogFallback />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </StorefrontShell>
  );
}

function HomeFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-rule" />
      <CatalogFallback />
    </div>
  );
}
