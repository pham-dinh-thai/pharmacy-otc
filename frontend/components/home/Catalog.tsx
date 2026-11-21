import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/product/ProductCard';
import {
  fetchStorefrontCategories,
  fetchStorefrontProducts,
} from '@/lib/storefront';

type CatalogSearchParams = Promise<{ q?: string; category?: string }>;

export async function Catalog({
  searchParams,
}: {
  searchParams: CatalogSearchParams;
}) {
  const { q = '', category: categoryId } = await searchParams;
  const query = q.trim();

  const [categories, result] = await Promise.all([
    fetchStorefrontCategories(),
    fetchStorefrontProducts({ q: query, category: categoryId }),
  ]);

  const category = categories.find((item) => item.id === categoryId);
  const isFiltered = Boolean(query || category);
  const title = category ? category.name : 'Sản phẩm';

  return (
    <Container className="py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em]">{title}</h2>
          <p className="mt-1 text-[13px] text-muted">
            {result.total} sản phẩm
            {query ? ` khớp với “${query}”` : ''}
          </p>
        </div>

        {isFiltered ? (
          <Link
            href="/"
            className="text-[13px] underline decoration-rule underline-offset-4 hover:text-accent"
          >
            Bỏ lọc
          </Link>
        ) : null}
      </div>

      {result.items.length === 0 ? (
        <div className="py-16">
          <p className="text-[15px] font-semibold">
            Không tìm thấy sản phẩm nào khớp với “{query}”.
          </p>
          <p className="mt-2 text-[13px] text-muted">
            Thử một từ khóa khác, hoặc xem toàn bộ danh mục.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-[13px] underline decoration-rule underline-offset-4 hover:text-accent"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}

export function CatalogFallback() {
  return (
    <Container className="py-14 lg:py-20">
      <div className="border-b border-rule pb-5">
        <div className="h-6 w-32 bg-surface" />
        <div className="mt-2 h-4 w-24 bg-surface" />
      </div>
      <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <div className="aspect-[4/3] bg-surface" />
            <div className="mt-4 h-4 w-3/4 bg-surface" />
            <div className="mt-2 h-4 w-1/2 bg-surface" />
          </div>
        ))}
      </div>
    </Container>
  );
}
