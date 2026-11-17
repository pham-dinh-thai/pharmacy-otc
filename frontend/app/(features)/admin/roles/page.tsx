import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { PermissionChips } from '@/components/roles/PermissionChips';
import { authFetch } from '@/lib/auth';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import type { Role } from '@/lib/roles';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

async function RolesList() {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/admin/roles');
  if (!user.isSuperAdmin && !hasPermission(user, 'roles:read')) {
    redirect('/admin');
  }

  const res = await authFetch('/roles');

  if (res.status === 401) redirect('/login?next=/admin/roles');
  if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);

  const roles: Role[] = await res.json();
  const canCreate = user.isSuperAdmin || hasPermission(user, 'roles:create');

  return (
    <WorkspacePage
      eyebrow="Quản trị"
      title="Vai trò & phân quyền"
      intro="Danh sách vai trò, quyền đang hiệu lực và quyền đã vô hiệu hoá."
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">{roles.length} vai trò</p>

        {canCreate && (
          <Link
            href="/admin/roles/new"
            className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
          >
            Thêm vai trò
          </Link>
        )}
      </div>

      {roles.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Vai trò</th>
                <th className={TH_CLASS}>Quyền đang hiệu lực</th>
                <th className={TH_CLASS}>Đã vô hiệu hoá</th>
                <th className={`${TH_CLASS} text-right`}>Quản lý</th>
              </tr>
            </thead>

            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className={TD_CLASS}>
                    <Link
                      href={`/admin/roles/${role.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {role.name}
                    </Link>

                    {role.isSuperAdmin && (
                      <span className="ml-2 border border-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                        Super Admin
                      </span>
                    )}
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

                  <td className={`${TD_CLASS} tabular-nums`}>
                    {role.revokedPermissions.length > 0
                      ? `${role.revokedPermissions.length} quyền`
                      : '—'}
                  </td>

                  <td className={`${TD_CLASS} text-right`}>
                    <Link
                      href={`/admin/roles/${role.id}`}
                      className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                    >
                      Quản lý quyền →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Chưa có vai trò nào trong hệ thống.
        </p>
      )}
    </WorkspacePage>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <RolesList />
    </Suspense>
  );
}
