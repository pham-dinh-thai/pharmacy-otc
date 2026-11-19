import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { ListFilterForm } from '@/components/pagination/ListFilterForm';
import { PageSizeForm } from '@/components/pagination/PageSizeForm';
import { PaginationNav } from '@/components/pagination/PaginationNav';
import { FormMessage } from '@/components/roles/FormMessage';
import { PermissionChips } from '@/components/roles/PermissionChips';
import { authFetch } from '@/lib/auth';
import { fetchCurrentUser } from '@/lib/account';
import {
  compactListFilters,
  first,
  listApiQuery,
  parseTriState,
} from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import type { RolePage } from '@/lib/roles';
import { disableRole, restoreRole } from './actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin vai trò.',
  forbidden: 'Bạn không có quyền thay đổi vai trò này.',
  cannotDisable: 'Không thể vô hiệu hoá vai trò Super Admin.',
  notDisabled: 'Vai trò này đang hoạt động.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  disabled:
    'Đã vô hiệu hoá vai trò. Vai trò không còn cấp quyền cho người dùng.',
  restored: 'Đã khôi phục vai trò.',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

async function RolesList({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    updated?: string;
    search?: string | string[];
    deleted?: string | string[];
    isSuperAdmin?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/roles');
  if (!user.isSuperAdmin) redirect('/dashboard');

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const search = first(query.search).trim();
  const deleted = parseTriState(first(query.deleted));
  const isSuperAdmin = parseTriState(first(query.isSuperAdmin));
  const filters = compactListFilters({ search, deleted, isSuperAdmin });
  const listHref = listPageHref('/roles', page, limit, filters);
  const res = await authFetch(`/roles?${listApiQuery(filters, page, limit)}`);

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(listHref)}`);
  if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);

  const result = (await res.json()) as RolePage;
  const roles = result.items;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/roles', totalPages, limit, filters));
  }
  const activeRoles = roles.filter((role) => role.deletedAt === null);
  const disabledRoles = roles.filter((role) => role.deletedAt !== null);
  const canCreate = user.isSuperAdmin;
  const canDelete = user.isSuperAdmin;
  const canUpdate = user.isSuperAdmin;

  const errorMessage = query.error
    ? (ERROR_MESSAGES[query.error] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated
      ? (UPDATED_MESSAGES[query.updated] ?? undefined)
      : undefined;

  return (
    <WorkspacePage
      eyebrow="Quản trị"
      title="Vai trò & phân quyền"
      intro="Vai trò đang hoạt động, quyền được cấp và các vai trò đã vô hiệu hoá."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <ListFilterForm
        action="/roles"
        limit={limit}
        search={search}
        searchPlaceholder="Tên vai trò"
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
          {
            name: 'isSuperAdmin',
            label: 'Loại vai trò',
            options: [
              { value: 'all', label: 'Tất cả' },
              { value: 'true', label: 'Super Admin' },
              { value: 'false', label: 'Vai trò thường' },
            ],
          },
        ]}
        values={{ deleted, isSuperAdmin }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} vai trò · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm action="/roles" limit={limit} filters={filters} />

          {canCreate && (
            <Link
              href="/roles/new"
              className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Thêm vai trò
            </Link>
          )}
        </div>
      </div>

      {activeRoles.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Vai trò</th>
                <th className={TH_CLASS}>Quyền đang hiệu lực</th>
                <th className={`${TH_CLASS} text-right`}>Quản lý</th>
                {canDelete && (
                  <th className={`${TH_CLASS} text-right`}>Hành động</th>
                )}
              </tr>
            </thead>

            <tbody>
              {activeRoles.map((role) => (
                <tr key={role.id}>
                  <td className={TD_CLASS}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/roles/${role.id}`}
                        className="whitespace-nowrap font-semibold hover:text-accent"
                      >
                        {role.name}
                      </Link>

                      {role.isSuperAdmin && (
                        <span className="whitespace-nowrap border border-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                          Super Admin
                        </span>
                      )}
                    </div>
                  </td>

                  <td className={TD_CLASS}>
                    {role.isSuperAdmin ? (
                      <span className="border border-accent px-2 py-0.5 text-[12px] leading-5 text-accent">
                        Toàn quyền
                      </span>
                    ) : role.permissions.length > 0 ? (
                      <PermissionChips
                        permissions={role.permissions}
                        limit={5}
                      />
                    ) : (
                      <span className="text-muted">Chưa cấp quyền</span>
                    )}
                  </td>

                  <td className={`${TD_CLASS} text-right`}>
                    <Link
                      href={`/roles/${role.id}`}
                      className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                    >
                      Quản lý quyền →
                    </Link>
                  </td>

                  {canDelete && (
                    <td className={`${TD_CLASS} text-right`}>
                      {role.isSuperAdmin ? (
                        <span className="whitespace-nowrap text-[12px] text-muted">
                          Không thể vô hiệu hoá
                        </span>
                      ) : (
                        <form action={disableRole}>
                          <input type="hidden" name="roleId" value={role.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={listHref}
                          />
                          <button
                            type="submit"
                            aria-label={`Vô hiệu hoá vai trò ${role.name}`}
                            className="whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700"
                          >
                            Vô hiệu hoá
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Chưa có vai trò nào đang hoạt động.
        </p>
      )}

      {disabledRoles.length > 0 && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Vai trò đã vô hiệu hoá
            </h2>
            <span className="text-[12px] tabular-nums text-muted">
              {disabledRoles.length} vai trò
            </span>
          </div>

          <p className="mt-2 text-[13px] leading-6 text-muted">
            Các vai trò này đã bị xoá mềm: không còn cấp quyền cho người dùng
            nhưng vẫn lưu để khôi phục.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Vai trò</th>
                  <th className={TH_CLASS}>Quyền đã lưu</th>
                  <th className={TH_CLASS}>Vô hiệu hoá lúc</th>
                  {canUpdate && (
                    <th className={`${TH_CLASS} text-right`}>Hành động</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {disabledRoles.map((role) => (
                  <tr key={role.id}>
                    <td className={TD_CLASS}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/roles/${role.id}`}
                          className="whitespace-nowrap font-semibold text-muted hover:text-accent"
                        >
                          {role.name}
                        </Link>

                        {role.isSuperAdmin && (
                          <span className="whitespace-nowrap border border-rule px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                            Super Admin
                          </span>
                        )}
                      </div>
                    </td>

                    <td className={`${TD_CLASS} text-muted`}>
                      {role.permissions.length > 0
                        ? `${role.permissions.length} quyền`
                        : '—'}
                    </td>

                    <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                      {role.deletedAt ? formatDate(role.deletedAt) : '—'}
                    </td>

                    {canUpdate && (
                      <td className={`${TD_CLASS} text-right`}>
                        <form action={restoreRole}>
                          <input type="hidden" name="roleId" value={role.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={listHref}
                          />
                          <button
                            type="submit"
                            aria-label={`Khôi phục vai trò ${role.name}`}
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
        path="/roles"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang vai trò"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    updated?: string;
    search?: string | string[];
    deleted?: string | string[];
    isSuperAdmin?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <RolesList searchParams={searchParams} />
    </Suspense>
  );
}
