import { Suspense } from 'react';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { Hero } from '@/components/home/Hero';
import {
  FeaturedProducts,
  FeaturedProductsFallback,
} from '@/components/home/FeaturedProducts';
import { fetchStorefrontCategories } from '@/lib/storefront';

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const categories = await fetchStorefrontCategories();

  return (
    <StorefrontShell categories={categories}>
      <Hero categories={categories} />

      <Suspense fallback={<FeaturedProductsFallback />}>
        <FeaturedProducts />
      </Suspense>
    </StorefrontShell>
  );
}

function HomeFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-rule" />
      <FeaturedProductsFallback />
    </div>
  );
}
