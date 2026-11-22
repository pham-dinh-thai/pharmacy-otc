import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CatalogFallback, CatalogView } from '@/components/catalog/CatalogView';
import { parseCatalogSegments } from '@/lib/catalog';

export const metadata = {
  title: 'Sản phẩm | PharmaOTC',
};

export default function CatalogPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogRoute params={params} />
    </Suspense>
  );
}

async function CatalogRoute({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments = [] } = await params;
  const state = parseCatalogSegments(segments);

  if (!state) {
    notFound();
  }

  return <CatalogView state={state} />;
}
