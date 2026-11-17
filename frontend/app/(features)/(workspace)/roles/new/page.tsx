import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser } from '@/lib/account';
import {
  actionLabel,
  fetchPermissionCatalog,
  resourceLabel,
} from '@/lib/permissions';
import { createRole } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập tên vai trò.',
  exists: 'Tên vai trò đã tồn tại.',
  invalid: 'Dữ liệu vai trò không hợp lệ.',
  forbidden: 'Bạn không có quyền tạo vai trò.',
  server: 'Không tạo được vai trò. Kiểm tra kết nối rồi thử lại.',
};

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

async function NewRoleForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/roles/new');
  if (!user.isSuperAdmin) redirect('/roles');

  const [catalog, { error }] = await Promise.all([
    fetchPermissionCatalog(),
    searchParams,
  ]);

  return (
    <WorkspacePage
      eyebrow="Quản trị · Vai trò"
      title="Thêm vai trò"
      intro="Đặt tên, chọn quyền và quyết định vai trò có phải Super Admin hay không."
    >
      <Link
        href="/roles"
        className="text-[13px] font-medium text-accent hover:underline"
      >
        ← Danh sách vai trò
      </Link>

      <div className="mt-6">
        <FormMessage
          message={
            error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server) : undefined
          }
        />
      </div>

      {catalog === null ? (
        <p className="text-[13px] leading-6 text-muted">
          Không tải được danh mục quyền từ máy chủ. Thử tải lại trang.
        </p>
      ) : (
        <form action={createRole} className="max-w-[860px] space-y-8">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[13px] font-medium text-muted"
            >
              Tên vai trò
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={50}
              autoComplete="off"
              placeholder="Ví dụ: Quản lý kho"
              className={INPUT_CLASS}
            />
          </div>

          <label className="flex items-start gap-2.5 border border-rule px-3 py-3">
            <input
              type="checkbox"
              name="isSuperAdmin"
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span className="text-[13px] leading-5">
              <span className="font-semibold">Super Admin</span>
              <span className="mt-0.5 block text-muted">
                Bỏ qua mọi kiểm tra quyền. Chỉ cấp cho vai trò quản trị cao
                nhất.
              </span>
            </span>
          </label>

          <fieldset className="space-y-6">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Quyền
            </legend>

            {catalog.map(({ resource, actions }) => (
              <div key={resource} className="border-t border-rule pt-4">
                <p className="text-[13px] font-semibold">
                  {resourceLabel(resource)}
                </p>

                <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {actions.map((action) => {
                    const permission = `${resource}:${action}`;

                    return (
                      <label
                        key={permission}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <input
                          type="checkbox"
                          name="permissions"
                          value={permission}
                          className="h-4 w-4 accent-accent"
                        />
                        <span>{actionLabel(action)}</span>
                        <span className="font-mono text-[11px] text-muted">
                          {permission}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
            <button
              type="submit"
              className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Tạo vai trò
            </button>
            <Link
              href="/roles"
              className="border border-rule px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-ink"
            >
              Huỷ
            </Link>
          </div>
        </form>
      )}
    </WorkspacePage>
  );
}

export default function NewRolePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewRoleForm searchParams={searchParams} />
    </Suspense>
  );
}
