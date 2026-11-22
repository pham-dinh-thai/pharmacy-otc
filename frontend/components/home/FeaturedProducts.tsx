import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/product/ProductCard';
import { fetchStorefrontProducts } from '@/lib/storefront';

export async function FeaturedProducts() {
  const result = await fetchStorefrontProducts({ page: 1, limit: 8 });

  return (
    <Container className="py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em]">
            Sản phẩm đang có
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Chọn sản phẩm để xem chi tiết và thông tin sử dụng.
          </p>
        </div>

        <Link
          href="/catalog"
          className="text-[13px] underline decoration-rule underline-offset-4 hover:text-accent"
        >
          Xem tất cả sản phẩm
        </Link>
      </div>

      {result.items.length === 0 ? (
        <p className="py-16 text-[14px] text-muted">
          Chưa có sản phẩm nào. Vui lòng quay lại sau.
        </p>
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

export function FeaturedProductsFallback() {
  return (
    <Container className="py-14 lg:py-20">
      <div className="border-b border-rule pb-5">
        <div className="h-6 w-40 bg-surface" />
        <div className="mt-2 h-4 w-56 bg-surface" />
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
