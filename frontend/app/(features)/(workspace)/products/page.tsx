/* eslint-disable @next/next/no-img-element */
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { ListFilterForm } from '@/components/pagination/ListFilterForm';
import { PageSizeForm } from '@/components/pagination/PageSizeForm';
import { PaginationNav } from '@/components/pagination/PaginationNav';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  compactListFilters,
  first,
  listApiQuery,
  parseTriState,
} from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import {
  PRODUCT_DELETED_FILTERS,
  PRODUCT_STOCK_FILTERS,
  fetchCategoryOptions,
  formatProductDate,
  isProductDeleted,
  productStateLabel,
  type ProductPage,
} from '@/lib/products';
import { formatVND } from '@/lib/utils';
import { deleteProduct, restoreProduct } from './actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin sản phẩm.',
  forbidden: 'Bạn không có quyền thay đổi sản phẩm.',
  invalid: 'Dữ liệu sản phẩm không hợp lệ. Kiểm tra lại các trường đã nhập.',
  exists: 'Mã SKU đã tồn tại. Đổi mã rồi thử lại.',
  notfound: 'Không tìm thấy sản phẩm.',
  image:
    'Không tải được ảnh. Chọn file JPG, PNG hoặc WebP dưới 5 MB rồi thử lại.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  created: 'Đã tạo sản phẩm.',
  saved: 'Đã cập nhật sản phẩm.',
  deleted: 'Đã xoá sản phẩm. Có thể khôi phục từ danh sách.',
  restored: 'Đã khôi phục sản phẩm.',
};

type ListQuery = {
  error?: string | string[];
  updated?: string | string[];
  search?: string | string[];
  deleted?: string | string[];
  categoryId?: string | string[];
  inStock?: string | string[];
  page?: string | string[];
  limit?: string | string[];
};

function StateCell({ deleted }: { deleted: boolean }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${
        deleted ? 'border-red-600 text-red-700' : 'border-rule text-muted'
      }`}
    >
      {productStateLabel(deleted)}
    </span>
  );
}

async function ProductsList({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/products');
  if (!user.isSuperAdmin && !hasPermission(user, 'products:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const search = first(query.search).trim();
  const deleted = parseTriState(first(query.deleted));
  const categoryId = first(query.categoryId).trim();
  const inStock = parseTriState(first(query.inStock));
  const filters = compactListFilters({ search, deleted, categoryId, inStock });
  const listHref = listPageHref('/products', page, limit, filters);
  const detailHref = (id: string) =>
    `/products/${id}?returnTo=${encodeURIComponent(listHref)}`;

  let res: Response;
  try {
    res = await authFetch(`/products?${listApiQuery(filters, page, limit)}`);
  } catch {
    throw new Error('Failed to fetch products: network error');
  }

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);

  const result = (await res.json()) as ProductPage;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/products', totalPages, limit, filters));
  }

  const categoryOptions = await fetchCategoryOptions();
  const categoryNames = new Map(
    categoryOptions.map((category) => [category.id, category.name]),
  );

  const canCreate = user.isSuperAdmin || hasPermission(user, 'products:create');
  const canUpdate = user.isSuperAdmin || hasPermission(user, 'products:update');
  const canDelete = user.isSuperAdmin || hasPermission(user, 'products:delete');

  const errorMessage = query.error
    ? (ERROR_MESSAGES[first(query.error)] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated
      ? UPDATED_MESSAGES[first(query.updated)]
      : undefined;

  const categoryLabel = (ids: string[]): string => {
    if (ids.length === 0) return '—';

    const names = ids
      .map((id) => categoryNames.get(id))
      .filter((name): name is string => Boolean(name));

    if (names.length === 0) return `${ids.length} danh mục`;
    if (names.length === ids.length) return names.join(', ');

    return `${names.join(', ')} (+${ids.length - names.length})`;
  };

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Sản phẩm"
      intro="Danh sách sản phẩm, đơn giá, tồn thực tế từ kho và danh mục liên kết."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <ListFilterForm
        action="/products"
        limit={limit}
        search={search}
        searchPlaceholder="Tên sản phẩm"
        selects={[
          {
            name: 'deleted',
            label: 'Trạng thái',
            options: PRODUCT_DELETED_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          },
          {
            name: 'inStock',
            label: 'Tồn kho',
            options: PRODUCT_STOCK_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          },
          {
            name: 'categoryId',
            label: 'Danh mục',
            options: [
              { value: '', label: 'Tất cả' },
              ...categoryOptions.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ],
          },
        ]}
        values={{ deleted, inStock, categoryId }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} sản phẩm · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm action="/products" limit={limit} filters={filters} />

          {canCreate && (
            <Link
              href="/products/new"
              className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Thêm sản phẩm
            </Link>
          )}
        </div>
      </div>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Sản phẩm</th>
                <th className={TH_CLASS}>SKU</th>
                <th className={TH_CLASS}>Đơn giá</th>
                <th className={`${TH_CLASS} text-right`}>Tồn</th>
                <th className={TH_CLASS}>Danh mục</th>
                <th className={TH_CLASS}>Trạng thái</th>
                <th className={TH_CLASS}>Cập nhật lúc</th>
                {(canUpdate || canDelete) && (
                  <th className={`${TH_CLASS} text-right`}>Hành động</th>
                )}
              </tr>
            </thead>

            <tbody>
              {result.items.map((product) => {
                const deletedProduct = isProductDeleted(product);

                return (
                  <tr key={product.id}>
                    <td className={TD_CLASS}>
                      <div className="flex items-start gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            width={44}
                            height={44}
                            className="h-11 w-11 shrink-0 border border-rule object-cover"
                          />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-dashed border-rule text-[11px] text-muted">
                            —
                          </span>
                        )}
                        <div>
                          <Link
                            href={detailHref(product.id)}
                            className="font-semibold hover:text-accent"
                          >
                            {product.name}
                          </Link>
                          {product.unit && (
                            <p className="mt-1 text-[12px] text-muted">
                              {product.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`${TD_CLASS} break-all text-muted`}>
                      {product.sku ?? '—'}
                    </td>
                    <td
                      className={`${TD_CLASS} whitespace-nowrap tabular-nums`}
                    >
                      {formatVND(Number(product.unitPrice))}
                    </td>
                    <td className={`${TD_CLASS} text-right tabular-nums`}>
                      {product.stockQuantity}
                    </td>
                    <td className={TD_CLASS}>
                      {categoryLabel(product.categoryIds)}
                    </td>
                    <td className={TD_CLASS}>
                      <StateCell deleted={deletedProduct} />
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                      {formatProductDate(product.updatedAt)}
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className={`${TD_CLASS} text-right`}>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={detailHref(product.id)}
                            className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                          >
                            Chi tiết
                          </Link>

                          {canUpdate && !deletedProduct && (
                            <Link
                              href={detailHref(product.id)}
                              className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                            >
                              Sửa
                            </Link>
                          )}

                          {canDelete && (
                            <form
                              action={
                                deletedProduct ? restoreProduct : deleteProduct
                              }
                            >
                              <input
                                type="hidden"
                                name="productId"
                                value={product.id}
                              />
                              <input
                                type="hidden"
                                name="returnTo"
                                value={listHref}
                              />
                              <button
                                type="submit"
                                aria-label={`${deletedProduct ? 'Khôi phục' : 'Xoá'} sản phẩm ${product.name}`}
                                className={
                                  deletedProduct
                                    ? 'whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper'
                                    : 'whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700'
                                }
                              >
                                {deletedProduct ? 'Khôi phục' : 'Xoá'}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Không có sản phẩm nào phù hợp với bộ lọc.
        </p>
      )}

      <PaginationNav
        path="/products"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang sản phẩm"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <ProductsList searchParams={searchParams} />
    </Suspense>
  );
}
