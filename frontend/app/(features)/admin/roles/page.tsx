import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { authFetch } from '@/lib/auth';
import { fetchCurrentUser, hasPermission } from '@/lib/account';

type Role = {
  id: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
};

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-3 pr-4 align-top';

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

  return (
    <WorkspacePage
      eyebrow="Quản trị"
      title="Vai trò & phân quyền"
      intro="Danh sách vai trò hiện có và bộ quyền đi kèm."
    >
      {roles.length > 0 ? (
        <table className="w-full max-w-[860px] border-collapse text-[13px]">
          <thead>
            <tr>
              <th className={TH_CLASS}>Vai trò</th>
              <th className={TH_CLASS}>Quyền</th>
              <th className={`${TH_CLASS} text-right`}>Super Admin</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td className={`${TD_CLASS} font-semibold`}>{role.name}</td>
                <td className={`${TD_CLASS} text-muted`}>
                  {role.permissions.length > 0
                    ? role.permissions.join(', ')
                    : '—'}
                </td>
                <td className={`${TD_CLASS} text-right`}>
                  {role.isSuperAdmin ? 'Có' : 'Không'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-[13px] leading-6 text-muted">
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
