import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import {
  fetchStorefrontCategories,
  fetchStorefrontProduct,
} from '@/lib/storefront';
import { formatVND } from '@/lib/utils';

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ProductDetailFallback />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    fetchStorefrontCategories(),
    fetchStorefrontProduct(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <StorefrontShell categories={categories}>
      <Container className="py-10 lg:py-14">
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
          <Link href="/" className="hover:text-accent">
            Sản phẩm
          </Link>
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-square overflow-hidden bg-surface">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                unoptimized
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <span className="grid h-full place-items-center text-[13px] text-muted">
                Chưa có ảnh
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-[13px] text-muted">
              {product.categories.map((category) => category.name).join(', ') ||
                'Sản phẩm'}
            </p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.02em]">
              {product.name}
            </h1>

            {product.sku ? (
              <p className="mt-3 text-[13px] text-muted">Mã: {product.sku}</p>
            ) : null}

            <p className="mt-6 text-[26px] font-bold tabular-nums">
              {formatVND(product.unitPrice)}
              {product.unit ? (
                <span className="ml-2 text-[13px] font-normal text-muted">
                  / {product.unit}
                </span>
              ) : null}
            </p>

            <p className="mt-2 text-[13px] text-muted">
              {product.inStock
                ? `Còn hàng (${product.stockQuantity})`
                : 'Hết hàng'}
            </p>

            <AddToCartButton
              product={product}
              label="Thêm vào giỏ hàng"
              className="mt-6 w-full py-3 text-[14px] sm:max-w-xs"
            />

            {product.description ? (
              <section className="mt-10 border-t border-rule pt-6">
                <h2 className="text-[15px] font-semibold">Mô tả</h2>
                <p className="mt-2 whitespace-pre-line text-[14px] leading-7 text-muted">
                  {product.description}
                </p>
              </section>
            ) : null}

            {product.warning ? (
              <section className="mt-6 border-t border-rule pt-6">
                <h2 className="text-[15px] font-semibold">Lưu ý sử dụng</h2>
                <p className="mt-2 whitespace-pre-line text-[14px] leading-7 text-muted">
                  {product.warning}
                </p>
              </section>
            ) : null}
          </div>
        </div>
      </Container>
    </StorefrontShell>
  );
}

function ProductDetailFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-rule" />
      <Container className="py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="aspect-square bg-surface" />
          <div>
            <div className="h-8 w-2/3 bg-surface" />
            <div className="mt-6 h-7 w-1/3 bg-surface" />
            <div className="mt-10 h-12 w-full bg-surface sm:max-w-xs" />
          </div>
        </div>
      </Container>
    </div>
  );
}
