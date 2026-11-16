import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { canAccessAdmin, fetchCurrentUser, hasPermission } from '@/lib/account';

async function AdminContent() {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/admin');
  if (!canAccessAdmin(user)) redirect('/account');

  const canReadRoles = user.isSuperAdmin || hasPermission(user, 'roles:read');

  return (
    <WorkspaceShell
      eyebrow="Quản trị"
      title="Trang điều khiển admin"
      intro="Quản lý vai trò, quyền truy cập và cấu hình vận hành."
    >
      <ul className="max-w-[760px] border-t border-rule">
        {canReadRoles && (
          <li className="border-b border-rule">
            <Link
              href="/roles"
              className="flex items-baseline justify-between gap-4 py-4 hover:text-accent"
            >
              <span>
                <span className="block text-[15px] font-semibold">
                  Vai trò & phân quyền
                </span>
                <span className="mt-0.5 block text-[13px] leading-5 text-muted">
                  Tạo vai trò, gán quyền và đặt cờ Super Admin.
                </span>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        )}
      </ul>

      <section className="mt-10 max-w-[760px]">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Quyền hiện tại
        </h2>
        <p className="mt-3 text-[13px] leading-6 text-muted">
          {user.isSuperAdmin
            ? 'Super Admin — bỏ qua mọi kiểm tra quyền.'
            : user.permissions.join(', ') || 'Chưa được cấp quyền nào.'}
        </p>
      </section>
    </WorkspaceShell>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminContent />
    </Suspense>
  );
}
