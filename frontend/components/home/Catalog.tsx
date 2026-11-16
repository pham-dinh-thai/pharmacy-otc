import Link from 'next/link';
import { CATEGORIES, MOCK_PRODUCTS } from '@/data/mock-data';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/product/ProductCard';

type CatalogSearchParams = Promise<{ q?: string; 'danh-muc'?: string }>;

/** Bỏ dấu tiếng Việt để "thuoc" khớp "thuốc". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export async function Catalog({
  searchParams,
}: {
  searchParams: CatalogSearchParams;
}) {
  const { q = '', 'danh-muc': categoryId } = await searchParams;
  const query = q.trim();
  const category = CATEGORIES.find((item) => item.id === categoryId);

  let products = MOCK_PRODUCTS;

  if (category) {
    products = products.filter((product) => product.category === category.id);
  }

  if (query) {
    const needle = normalize(query);
    products = products.filter((product) =>
      normalize(
        [
          product.name,
          product.activeIngredient,
          product.manufacturer,
          product.categoryName,
          product.subCategory,
        ]
          .filter(Boolean)
          .join(' ')
      ).includes(needle)
    );
  }

  const isFiltered = Boolean(query || category);
  const title = category ? category.name : 'Sản phẩm';

  return (
    <Container className="py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em]">{title}</h2>
          <p className="mt-1 text-[13px] text-muted">
            {products.length} sản phẩm
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

      {products.length === 0 ? (
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
          {products.map((product) => (
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
