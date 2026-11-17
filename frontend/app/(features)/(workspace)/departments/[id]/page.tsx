import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import type { Department } from '@/lib/departments';
import {
  disableDepartment,
  restoreDepartment,
  updateDepartment,
} from '../actions';

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
  restored: 'Đã khôi phục phòng ban.',
};

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

function formatDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

async function DepartmentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const user = await fetchCurrentUser();
  const next = `/departments/${id}`;

  if (!user) redirect(`/login?next=${next}`);
  if (!user.isSuperAdmin && !hasPermission(user, 'departments:read')) {
    redirect('/dashboard');
  }

  const [res, query] = await Promise.all([authFetch(`/departments/${id}`), searchParams]);

  if (res.status === 401) redirect(`/login?next=${next}`);
  if (res.status === 403) redirect('/dashboard');
  if (res.status === 400 || res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch department: ${res.status}`);

  const department: Department = await res.json();
  const isDisabled = department.deletedAt !== null;
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
      eyebrow="Không gian làm việc · Phòng ban"
      title={department.name}
      intro={
        isDisabled
          ? 'Phòng ban đã bị vô hiệu hoá. Có thể khôi phục để đưa lại vào danh sách chính.'
          : 'Thông tin phòng ban đang hoạt động.'
      }
    >
      <Link
        href="/departments"
        className="text-[13px] font-medium text-accent hover:underline"
      >
        ← Danh sách phòng ban
      </Link>

      <div className="mt-6">
        <FormMessage message={errorMessage} />
        <FormMessage message={updatedMessage} tone="success" />
      </div>

      {isDisabled && (
        <section className="mb-8 border-l-2 border-red-600 bg-red-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-red-700">
            Phòng ban đã bị vô hiệu hoá
          </p>
          <p className="mt-1 text-[13px] leading-6 text-red-700">
            {department.deletedAt
              ? `Thời điểm vô hiệu hoá: ${formatDate(department.deletedAt)}.`
              : ''}
          </p>

          {canDelete && (
            <form action={restoreDepartment} className="mt-3">
              <input
                type="hidden"
                name="departmentId"
                value={department.id}
              />
              <input type="hidden" name="returnTo" value={next} />
              <button
                type="submit"
                className="border border-accent bg-paper px-3 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent hover:text-paper"
              >
                Khôi phục phòng ban
              </button>
            </form>
          )}
        </section>
      )}

      <section className="max-w-[860px]">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Thông tin
          </h2>
          <span className="text-[12px] tabular-nums text-muted">
            {isDisabled ? 'Đã vô hiệu hoá' : 'Đang hoạt động'}
          </span>
        </div>

        <dl className="divide-y divide-rule border-b border-rule text-[13px]">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Tạo lúc</dt>
            <dd className="text-right tabular-nums">
              {formatDate(department.createdAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Cập nhật lúc</dt>
            <dd className="text-right tabular-nums">
              {formatDate(department.updatedAt)}
            </dd>
          </div>
        </dl>

        {!isDisabled && canUpdate && (
          <form action={updateDepartment} className="mt-8 space-y-6">
            <input type="hidden" name="departmentId" value={department.id} />
            <input type="hidden" name="returnTo" value={next} />

            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-[13px] font-medium text-muted"
              >
                Tên phòng ban
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={255}
                autoComplete="off"
                defaultValue={department.name}
                className={INPUT_CLASS}
              />
            </div>

            <button
              type="submit"
              className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Lưu thay đổi
            </button>
          </form>
        )}

        {!isDisabled && canDelete && (
          <form action={disableDepartment} className="mt-8 border-t border-rule pt-6">
            <input type="hidden" name="departmentId" value={department.id} />
            <input type="hidden" name="returnTo" value={next} />
            <button
              type="submit"
              className="border border-red-600 px-3 py-1.5 text-[12px] font-semibold text-red-700 transition-colors hover:bg-red-600 hover:text-paper"
            >
              Vô hiệu hoá phòng ban
            </button>
          </form>
        )}
      </section>
    </WorkspacePage>
  );
}

export default function DepartmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <DepartmentDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}
