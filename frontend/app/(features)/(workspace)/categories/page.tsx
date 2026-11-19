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
  CATEGORY_DELETED_FILTERS,
  categoryStateLabel,
  formatCategoryDate,
  isCategoryDeleted,
  type CategoryPage,
} from '@/lib/categories';
import {
  compactListFilters,
  first,
  listApiQuery,
  parseTriState,
} from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import { deleteCategory, restoreCategory } from './actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin danh mục.',
  invalid: 'Dữ liệu danh mục không hợp lệ. Kiểm tra lại các trường đã nhập.',
  exists: 'Tên hoặc slug danh mục đã tồn tại.',
  forbidden: 'Bạn không có quyền thay đổi danh mục.',
  notfound: 'Không tìm thấy danh mục.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  created: 'Đã tạo danh mục.',
  saved: 'Đã cập nhật danh mục.',
  deleted: 'Đã xoá danh mục. Có thể khôi phục từ danh sách.',
  restored: 'Đã khôi phục danh mục.',
};

type ListQuery = {
  error?: string | string[];
  updated?: string | string[];
  search?: string | string[];
  deleted?: string | string[];
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
      {categoryStateLabel(deleted)}
    </span>
  );
}

async function CategoriesList({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/categories');
  if (!user.isSuperAdmin && !hasPermission(user, 'categories:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const search = first(query.search).trim();
  const deleted = parseTriState(first(query.deleted));
  const filters = compactListFilters({ search, deleted });
  const listHref = listPageHref('/categories', page, limit, filters);
  const detailHref = (id: string) =>
    `/categories/${id}?returnTo=${encodeURIComponent(listHref)}`;

  let res: Response;
  try {
    res = await authFetch(`/categories?${listApiQuery(filters, page, limit)}`);
  } catch {
    throw new Error('Failed to fetch categories: network error');
  }

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);

  const result = (await res.json()) as CategoryPage;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/categories', totalPages, limit, filters));
  }

  const canCreate =
    user.isSuperAdmin || hasPermission(user, 'categories:create');
  const canUpdate =
    user.isSuperAdmin || hasPermission(user, 'categories:update');
  const canDelete =
    user.isSuperAdmin || hasPermission(user, 'categories:delete');

  const errorMessage = query.error
    ? (ERROR_MESSAGES[first(query.error)] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated
      ? UPDATED_MESSAGES[first(query.updated)]
      : undefined;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Danh mục"
      intro="Nhóm sản phẩm, slug và trạng thái hoạt động của từng danh mục."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <ListFilterForm
        action="/categories"
        limit={limit}
        search={search}
        searchPlaceholder="Tên hoặc slug danh mục"
        selects={[
          {
            name: 'deleted',
            label: 'Trạng thái',
            options: CATEGORY_DELETED_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          },
        ]}
        values={{ deleted }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} danh mục · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm action="/categories" limit={limit} filters={filters} />

          {canCreate && (
            <Link
              href="/categories/new"
              className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Thêm danh mục
            </Link>
          )}
        </div>
      </div>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Danh mục</th>
                <th className={TH_CLASS}>Slug</th>
                <th className={TH_CLASS}>Mô tả</th>
                <th className={TH_CLASS}>Trạng thái</th>
                <th className={TH_CLASS}>Cập nhật lúc</th>
                {(canUpdate || canDelete) && (
                  <th className={`${TH_CLASS} text-right`}>Hành động</th>
                )}
              </tr>
            </thead>

            <tbody>
              {result.items.map((category) => {
                const deletedCategory = isCategoryDeleted(category);

                return (
                  <tr key={category.id}>
                    <td className={TD_CLASS}>
                      <Link
                        href={detailHref(category.id)}
                        className="font-semibold hover:text-accent"
                      >
                        {category.name}
                      </Link>
                    </td>
                    <td className={`${TD_CLASS} break-all text-muted`}>
                      {category.slug}
                    </td>
                    <td className={`${TD_CLASS} max-w-[280px] text-muted`}>
                      {category.description ?? '—'}
                    </td>
                    <td className={TD_CLASS}>
                      <StateCell deleted={deletedCategory} />
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                      {formatCategoryDate(category.updatedAt)}
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className={`${TD_CLASS} text-right`}>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={detailHref(category.id)}
                            className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                          >
                            Chi tiết
                          </Link>

                          {canUpdate && !deletedCategory && (
                            <Link
                              href={detailHref(category.id)}
                              className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                            >
                              Sửa
                            </Link>
                          )}

                          {canDelete && (
                            <form
                              action={
                                deletedCategory ? restoreCategory : deleteCategory
                              }
                            >
                              <input
                                type="hidden"
                                name="categoryId"
                                value={category.id}
                              />
                              <input
                                type="hidden"
                                name="returnTo"
                                value={listHref}
                              />
                              <button
                                type="submit"
                                aria-label={`${deletedCategory ? 'Khôi phục' : 'Xoá'} danh mục ${category.name}`}
                                className={
                                  deletedCategory
                                    ? 'whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper'
                                    : 'whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700'
                                }
                              >
                                {deletedCategory ? 'Khôi phục' : 'Xoá'}
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
          Không có danh mục nào phù hợp với bộ lọc.
        </p>
      )}

      <PaginationNav
        path="/categories"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang danh mục"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <CategoriesList searchParams={searchParams} />
    </Suspense>
  );
}
