import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { authFetch } from '@/lib/auth';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import {
  fetchPermissionCatalog,
  permissionLabel,
  permissionOptions,
  sortPermissions,
} from '@/lib/permissions';
import type { Role } from '@/lib/roles';
import { grantPermission, revokePermission } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin vai trò hoặc quyền.',
  forbidden: 'Bạn không có quyền thay đổi vai trò này.',
  granted: 'Quyền này đã được cấp cho vai trò.',
  notGranted: 'Quyền này không còn hiệu lực để vô hiệu hoá.',
  invalid: 'Quyền không hợp lệ.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  granted: 'Đã thêm quyền cho vai trò.',
  restored: 'Đã kích hoạt lại quyền cho vai trò.',
  revoked: 'Đã vô hiệu hoá quyền. Quyền vẫn được lưu để kích hoạt lại.',
};

async function RoleDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const user = await fetchCurrentUser();

  if (!user) redirect(`/login?next=/admin/roles/${id}`);
  if (!user.isSuperAdmin && !hasPermission(user, 'roles:read')) {
    redirect('/admin');
  }

  const [res, catalog, query] = await Promise.all([
    authFetch(`/roles/${id}`),
    fetchPermissionCatalog(),
    searchParams,
  ]);

  if (res.status === 401) redirect(`/login?next=/admin/roles/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch role: ${res.status}`);

  const role: Role = await res.json();
  const canManage = user.isSuperAdmin || hasPermission(user, 'roles:update');
  const resources = catalog ?? [];
  const granted = sortPermissions(role.permissions, resources);
  const revoked = sortPermissions(role.revokedPermissions, resources);
  const options = permissionOptions(resources).filter(
    (permission) => !role.permissions.includes(permission),
  );

  const errorMessage = query.error
    ? (ERROR_MESSAGES[query.error] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated ? UPDATED_MESSAGES[query.updated] : undefined;

  return (
    <WorkspacePage
      eyebrow="Quản trị · Vai trò"
      title={role.name}
      intro="Quyền đang hiệu lực, quyền đã vô hiệu hoá và quyền có thể cấp thêm."
    >
      <Link
        href="/admin/roles"
        className="text-[13px] font-medium text-accent hover:underline"
      >
        ← Danh sách vai trò
      </Link>

      <div className="mt-6">
        <FormMessage message={errorMessage} />
        <FormMessage message={updatedMessage} tone="success" />
      </div>

      {role.isSuperAdmin && (
        <p className="mb-6 border-l-2 border-accent bg-accent-soft px-3 py-2 text-[13px] leading-5 text-accent">
          Vai trò này là Super Admin: mọi kiểm tra quyền đều được bỏ qua, kể cả
          khi danh sách quyền bên dưới trống.
        </p>
      )}

      <section className="max-w-[860px]">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Quyền đang hiệu lực
          </h2>
          <span className="text-[12px] tabular-nums text-muted">
            {granted.length} quyền
          </span>
        </div>

        {granted.length > 0 ? (
          <ul>
            {granted.map((permission) => (
              <li
                key={permission}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-2.5"
              >
                <span className="text-[13px]">
                  {permissionLabel(permission)}
                  <span className="ml-2 font-mono text-[11px] text-muted">
                    {permission}
                  </span>
                </span>

                {canManage && (
                  <form action={revokePermission}>
                    <input type="hidden" name="roleId" value={role.id} />
                    <input type="hidden" name="permission" value={permission} />
                    <button
                      type="submit"
                      aria-label={`Vô hiệu hoá quyền ${permissionLabel(permission)}`}
                      className="border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700"
                    >
                      Vô hiệu hoá
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-[13px] leading-6 text-muted">
            {role.isSuperAdmin
              ? 'Không có quyền cụ thể nào được lưu.'
              : 'Vai trò chưa được cấp quyền nào.'}
          </p>
        )}
      </section>

      {canManage && (
        <section className="mt-10 max-w-[860px]">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Thêm quyền
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-muted">
            Chọn một quyền trong danh mục để cấp cho vai trò. Quyền đã vô hiệu
            hoá sẽ được kích hoạt lại.
          </p>

          {catalog === null ? (
            <p className="mt-3 text-[13px] leading-6 text-muted">
              Không tải được danh mục quyền từ máy chủ. Thử tải lại trang.
            </p>
          ) : options.length > 0 ? (
            <form
              action={grantPermission}
              className="mt-3 flex flex-wrap items-center gap-3"
            >
              <input type="hidden" name="roleId" value={role.id} />
              <select
                name="permission"
                required
                defaultValue=""
                aria-label="Quyền cần thêm"
                className="min-w-[280px] flex-1 border border-rule bg-paper px-3 py-2.5 text-[13px] focus:border-ink"
              >
                <option value="" disabled>
                  Chọn quyền…
                </option>
                {options.map((permission) => (
                  <option key={permission} value={permission}>
                    {permissionLabel(permission)}
                    {role.revokedPermissions.includes(permission)
                      ? ' (đã vô hiệu hoá)'
                      : ''}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
              >
                Thêm quyền
              </button>
            </form>
          ) : (
            <p className="mt-3 text-[13px] leading-6 text-muted">
              Danh mục quyền đã được cấp đầy đủ.
            </p>
          )}
        </section>
      )}

      <section className="mt-10 max-w-[860px]">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Quyền đã vô hiệu hoá
          </h2>
          <span className="text-[12px] tabular-nums text-muted">
            {revoked.length} quyền
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-6 text-muted">
          Các quyền này đã bị xoá mềm: không còn hiệu lực nhưng vẫn lưu trong
          vai trò để kích hoạt lại.
        </p>

        {revoked.length > 0 ? (
          <ul>
            {revoked.map((permission) => (
              <li
                key={permission}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-2.5"
              >
                <span className="text-[13px] text-muted line-through decoration-rule">
                  {permissionLabel(permission)}
                  <span className="ml-2 font-mono text-[11px]">
                    {permission}
                  </span>
                </span>

                {canManage && (
                  <form action={grantPermission}>
                    <input type="hidden" name="roleId" value={role.id} />
                    <input type="hidden" name="permission" value={permission} />
                    <input type="hidden" name="mode" value="restore" />
                    <button
                      type="submit"
                      aria-label={`Kích hoạt lại quyền ${permissionLabel(permission)}`}
                      className="border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper"
                    >
                      Kích hoạt lại
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-[13px] leading-6 text-muted">
            Chưa có quyền nào bị vô hiệu hoá.
          </p>
        )}
      </section>
    </WorkspacePage>
  );
}

export default function RoleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <RoleDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}
