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
import type { DepartmentPage } from '@/lib/departments';
import {
  compactListFilters,
  first,
  listApiQuery,
  parseTriState,
} from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import { disableDepartment, restoreDepartment } from './actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin phòng ban.',
  forbidden: 'Bạn không có quyền thay đổi phòng ban.',
  exists: 'Tên phòng ban đã tồn tại.',
  invalid: 'Dữ liệu phòng ban không hợp lệ.',
  alreadyDisabled: 'Phòng ban này đã bị vô hiệu hoá.',
  notDisabled: 'Phòng ban này đang hoạt động.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  saved: 'Đã cập nhật phòng ban.',
  disabled: 'Đã vô hiệu hoá phòng ban. Có thể khôi phục ở bảng bên dưới.',
  restored: 'Đã khôi phục phòng ban.',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

async function DepartmentsList({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    updated?: string;
    search?: string | string[];
    deleted?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/departments');
  if (!user.isSuperAdmin && !hasPermission(user, 'departments:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const search = first(query.search).trim();
  const deleted = parseTriState(first(query.deleted));
  const filters = compactListFilters({ search, deleted });
  const listHref = listPageHref('/departments', page, limit, filters);
  const res = await authFetch(`/departments?${listApiQuery(filters, page, limit)}`);

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(listHref)}`);
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch departments: ${res.status}`);

  const result = (await res.json()) as DepartmentPage;
  const departments = result.items;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/departments', totalPages, limit, filters));
  }
  const activeDepartments = departments.filter(
    (department) => department.deletedAt === null,
  );
  const disabledDepartments = departments.filter(
    (department) => department.deletedAt !== null,
  );

  const canCreate =
    user.isSuperAdmin || hasPermission(user, 'departments:create');
  const canUpdate =
    user.isSuperAdmin || hasPermission(user, 'departments:update');
  const canDelete =
    user.isSuperAdmin || hasPermission(user, 'departments:delete');

  const errorMessage = query.error
    ? (ERROR_MESSAGES[query.error] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated
      ? UPDATED_MESSAGES[query.updated]
      : undefined;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Phòng ban"
      intro="Danh sách phòng ban đang hoạt động và các phòng ban đã vô hiệu hoá."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <ListFilterForm
        action="/departments"
        limit={limit}
        search={search}
        searchPlaceholder="Tên phòng ban"
        selects={[
          {
            name: 'deleted',
            label: 'Trạng thái',
            options: [
              { value: 'all', label: 'Tất cả' },
              { value: 'false', label: 'Đang hoạt động' },
              { value: 'true', label: 'Đã vô hiệu hoá' },
            ],
          },
        ]}
        values={{ deleted }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} phòng ban · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm action="/departments" limit={limit} filters={filters} />

          {canCreate && (
            <Link
              href="/departments/new"
              className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Thêm phòng ban
            </Link>
          )}
        </div>
      </div>

      {activeDepartments.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Phòng ban</th>
                <th className={TH_CLASS}>Cập nhật lúc</th>
                {(canUpdate || canDelete) && (
                  <th className={`${TH_CLASS} text-right`}>Hành động</th>
                )}
              </tr>
            </thead>

            <tbody>
              {activeDepartments.map((department) => (
                <tr key={department.id}>
                  <td className={TD_CLASS}>
                    <Link
                      href={`/departments/${department.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {department.name}
                    </Link>
                  </td>

                  <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                    {formatDate(department.updatedAt)}
                  </td>

                  {(canUpdate || canDelete) && (
                    <td className={`${TD_CLASS} text-right`}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {canUpdate && (
                          <Link
                            href={`/departments/${department.id}`}
                            className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                          >
                            Sửa
                          </Link>
                        )}

                        {canDelete && (
                          <form action={disableDepartment}>
                            <input
                              type="hidden"
                              name="departmentId"
                              value={department.id}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={listHref}
                            />
                            <button
                              type="submit"
                              aria-label={`Vô hiệu hoá phòng ban ${department.name}`}
                              className="whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700"
                            >
                              Vô hiệu hoá
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Chưa có phòng ban nào đang hoạt động.
        </p>
      )}

      {disabledDepartments.length > 0 && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Phòng ban đã vô hiệu hoá
            </h2>
            <span className="text-[12px] tabular-nums text-muted">
              {disabledDepartments.length} phòng ban
            </span>
          </div>

          <p className="mt-2 text-[13px] leading-6 text-muted">
            Các phòng ban này đã bị xoá mềm: ẩn khỏi danh sách chính nhưng vẫn
            lưu để khôi phục.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Phòng ban</th>
                  <th className={TH_CLASS}>Vô hiệu hoá lúc</th>
                  {canDelete && (
                    <th className={`${TH_CLASS} text-right`}>Hành động</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {disabledDepartments.map((department) => (
                  <tr key={department.id}>
                    <td className={`${TD_CLASS} text-muted`}>
                      <Link
                        href={`/departments/${department.id}`}
                        className="hover:text-accent"
                      >
                        {department.name}
                      </Link>
                    </td>

                    <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                      {department.deletedAt
                        ? formatDate(department.deletedAt)
                        : '—'}
                    </td>

                    {canDelete && (
                      <td className={`${TD_CLASS} text-right`}>
                        <form action={restoreDepartment}>
                          <input
                            type="hidden"
                            name="departmentId"
                            value={department.id}
                          />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={listHref}
                          />
                          <button
                            type="submit"
                            aria-label={`Khôi phục phòng ban ${department.name}`}
                            className="whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper"
                          >
                            Khôi phục
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <PaginationNav
        path="/departments"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang phòng ban"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    updated?: string;
    search?: string | string[];
    deleted?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <DepartmentsList searchParams={searchParams} />
    </Suspense>
  );
}
