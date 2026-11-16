import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { fetchCurrentUser } from '@/lib/account';
import { staffNav, subItems } from '@/lib/workspace';

const CELL_CLASS = 'bg-paper px-5 py-4';
const LABEL_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.16em] text-muted';
const VALUE_CLASS = 'mt-1 text-[14px]';

async function StaffOverview() {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/staff');

  const items = subItems(staffNav(user), '/staff');

  return (
    <WorkspacePage
      eyebrow="Nhân viên"
      title="Tổng quan"
      intro="Tra cứu sản phẩm và nhà cung cấp trong hệ thống."
    >
      <dl className="grid max-w-[620px] grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2">
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

      <section className="mt-10 max-w-[760px]">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Chức năng
        </h2>

        {items.length > 0 ? (
          <ul className="mt-3 border-t border-rule">
            {items.map((item) => (
              <li key={item.href} className="border-b border-rule">
                <Link
                  href={item.href}
                  className="flex items-baseline justify-between gap-4 py-4 hover:text-accent"
                >
                  <span>
                    <span className="block text-[15px] font-semibold">
                      {item.label}
                    </span>
                    {item.hint && (
                      <span className="mt-0.5 block text-[13px] leading-5 text-muted">
                        {item.hint}
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] leading-6 text-muted">
            Tài khoản chưa được cấp chức năng tra cứu nào.
          </p>
        )}
      </section>

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
    </WorkspacePage>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <StaffOverview />
    </Suspense>
  );
}
