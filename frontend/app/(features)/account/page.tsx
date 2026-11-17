import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  WorkspacePage,
  WorkspaceShell,
} from '@/components/layout/WorkspaceShell';
import { displayName, fetchCurrentUser } from '@/lib/account';

const CELL_CLASS = 'bg-paper px-5 py-4';
const LABEL_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.16em] text-muted';
const VALUE_CLASS = 'mt-1 text-[14px]';

async function AccountContent() {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/account');

  return (
    <WorkspaceShell>
      <WorkspacePage
        eyebrow="Tài khoản"
        title={displayName(user)}
        intro="Thông tin đăng nhập và quyền hiện có của bạn."
      >
        <dl className="grid max-w-[620px] grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2">
          <div className={CELL_CLASS}>
            <dt className={LABEL_CLASS}>Họ tên</dt>
            <dd className={VALUE_CLASS}>{displayName(user)}</dd>
          </div>

          <div className={CELL_CLASS}>
            <dt className={LABEL_CLASS}>Email</dt>
            <dd className={`${VALUE_CLASS} break-all`}>{user.email}</dd>
          </div>

          <div className={CELL_CLASS}>
            <dt className={LABEL_CLASS}>Vai trò</dt>
            <dd className={VALUE_CLASS}>
              {user.isSuperAdmin ? 'Super Admin' : 'Thành viên'}
            </dd>
          </div>

          <div className={CELL_CLASS}>
            <dt className={LABEL_CLASS}>Quyền</dt>
            <dd className={VALUE_CLASS}>
              {user.isSuperAdmin
                ? 'Toàn quyền'
                : `${user.permissions.length} quyền`}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/account/password"
            className="border border-ink px-4 py-2.5 text-[13px] font-semibold hover:bg-ink hover:text-paper"
          >
            Đổi mật khẩu
          </Link>

          <Link
            href="/dashboard"
            className="border border-rule px-4 py-2.5 text-[13px] font-medium hover:border-ink"
          >
            Không gian làm việc
          </Link>
        </div>
      </WorkspacePage>
    </WorkspaceShell>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AccountContent />
    </Suspense>
  );
}
