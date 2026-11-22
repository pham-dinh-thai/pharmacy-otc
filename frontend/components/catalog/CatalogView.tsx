import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { ProductCard } from '@/components/product/ProductCard';
import {
  CATALOG_PAGE_SIZE,
  catalogHref,
  catalogPageNumbers,
  type CatalogState,
} from '@/lib/catalog';
import {
  fetchStorefrontCategories,
  fetchStorefrontProducts,
} from '@/lib/storefront';

export async function CatalogView({ state }: { state: CatalogState }) {
  const [categories, allProducts] = await Promise.all([
    fetchStorefrontCategories(),
    fetchStorefrontProducts({ page: 1, limit: 1 }),
  ]);

  let categoryId: string | undefined;
  let categoryName: string | undefined;
  let categoryDescription: string | null = null;

  if (state.kind === 'category') {
    const category = categories.find((item) => item.slug === state.slug);
    if (!category) notFound();

    categoryId = category.id;
    categoryName = category.name;
    categoryDescription = category.description;
  }

  const result = await fetchStorefrontProducts({
    q: state.kind === 'search' ? state.query : undefined,
    category: categoryId,
    page: state.page,
    limit: CATALOG_PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / CATALOG_PAGE_SIZE));
  const title =
    state.kind === 'category'
      ? (categoryName ?? 'Sản phẩm')
      : state.kind === 'search'
        ? `Kết quả cho “${state.query}”`
        : 'Tất cả sản phẩm';

  const allState: CatalogState = { kind: 'all', page: 1 };

  return (
    <StorefrontShell categories={categories}>
      <Container className="py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <h2 className="text-[13px] font-medium text-muted">Danh mục</h2>
            <ul className="mt-3 border-y border-rule">
              <li>
                <Link
                  href={catalogHref(allState, 1)}
                  className={sidebarLinkClass(state.kind === 'all')}
                  aria-current={state.kind === 'all' ? 'page' : undefined}
                >
                  <span>Tất cả sản phẩm</span>
                  <span className="tabular-nums text-[12px] text-muted">
                    {allProducts.total}
                  </span>
                </Link>
              </li>

              {categories.map((category) => {
                const active =
                  state.kind === 'category' && state.slug === category.slug;

                return (
                  <li key={category.id}>
                    <Link
                      href={catalogHref({
                        kind: 'category',
                        slug: category.slug,
                        page: 1,
                      })}
                      className={sidebarLinkClass(active)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span>{category.name}</span>
                      <span className="tabular-nums text-[12px] text-muted">
                        {category.productCount}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section aria-label="Danh sách sản phẩm">
            <div className="border-b border-rule pb-6">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
                {title}
              </h1>
              <p className="mt-2 text-[13px] text-muted">
                {result.total} sản phẩm
                {totalPages > 1 ? ` · trang ${state.page}/${totalPages}` : ''}
              </p>

              {state.kind === 'category' && categoryDescription ? (
                <p className="mt-3 max-w-[65ch] text-[14px] leading-6 text-muted">
                  {categoryDescription}
                </p>
              ) : null}

              {state.kind === 'search' ? (
                <Link
                  href={catalogHref(allState, 1)}
                  className="mt-3 inline-block text-[13px] underline decoration-rule underline-offset-4 hover:text-accent"
                >
                  Xoá tìm kiếm
                </Link>
              ) : null}
            </div>

            {result.items.length === 0 ? (
              <div className="py-16">
                <p className="text-[15px] font-semibold">
                  Không có sản phẩm để hiển thị.
                </p>
                <p className="mt-2 text-[13px] text-muted">
                  Thử danh mục khác, hoặc xem toàn bộ sản phẩm.
                </p>
                <Link
                  href={catalogHref(allState, 1)}
                  className="mt-4 inline-block text-[13px] underline decoration-rule underline-offset-4 hover:text-accent"
                >
                  Xem tất cả sản phẩm
                </Link>
              </div>
            ) : (
              <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 ? (
              <nav
                aria-label="Phân trang"
                className="mt-14 flex flex-wrap items-center justify-center gap-1 text-[13px]"
              >
                {state.page > 1 ? (
                  <PageLink state={state} page={state.page - 1}>
                    Trang trước
                  </PageLink>
                ) : (
                  <span className="px-3 py-2 text-muted/50">Trang trước</span>
                )}

                {catalogPageNumbers(state.page, totalPages).map(
                  (page, index) =>
                    page === 'gap' ? (
                      <span key={`gap-${index}`} className="px-2 text-muted">
                        …
                      </span>
                    ) : (
                      <PageLink key={page} state={state} page={page}>
                        {page}
                      </PageLink>
                    ),
                )}

                {state.page < totalPages ? (
                  <PageLink state={state} page={state.page + 1}>
                    Trang sau
                  </PageLink>
                ) : (
                  <span className="px-3 py-2 text-muted/50">Trang sau</span>
                )}
              </nav>
            ) : null}
          </section>
        </div>
      </Container>
    </StorefrontShell>
  );
}

function sidebarLinkClass(active: boolean): string {
  return `flex items-center justify-between gap-3 border-l-2 py-2.5 pl-3 pr-1 text-[13px] ${
    active
      ? 'border-accent bg-accent-soft font-semibold text-accent'
      : 'border-transparent hover:border-rule hover:text-accent'
  }`;
}

function PageLink({
  state,
  page,
  children,
}: {
  state: CatalogState;
  page: number;
  children: React.ReactNode;
}) {
  const active = page === state.page;

  return (
    <Link
      href={catalogHref(state, page)}
      aria-current={active ? 'page' : undefined}
      className={`min-w-9 border px-3 py-2 text-center ${
        active
          ? 'border-accent bg-accent font-semibold text-paper'
          : 'border-rule hover:border-accent hover:text-accent'
      }`}
    >
      {children}
    </Link>
  );
}

export function CatalogFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-rule" />
      <Container className="py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <div>
            <div className="h-4 w-20 bg-surface" />
            <div className="mt-3 h-48 border-y border-rule" />
          </div>
          <div>
            <div className="h-8 w-1/2 bg-surface" />
            <div className="mt-2 h-4 w-32 bg-surface" />
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index}>
                  <div className="aspect-[4/3] bg-surface" />
                  <div className="mt-4 h-4 w-3/4 bg-surface" />
                  <div className="mt-2 h-4 w-1/2 bg-surface" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
