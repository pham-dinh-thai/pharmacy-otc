import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { createDepartment } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập tên phòng ban.',
  exists: 'Tên phòng ban đã tồn tại.',
  invalid: 'Dữ liệu phòng ban không hợp lệ.',
  forbidden: 'Bạn không có quyền tạo phòng ban.',
  server: 'Không tạo được phòng ban. Kiểm tra kết nối rồi thử lại.',
};

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

async function NewDepartmentForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/departments/new');
  if (!user.isSuperAdmin && !hasPermission(user, 'departments:create')) {
    redirect('/departments');
  }

  const { error } = await searchParams;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc · Phòng ban"
      title="Thêm phòng ban"
      intro="Nhập tên phòng ban. Tên phải chưa được dùng cho phòng ban khác."
    >
      <Link
        href="/departments"
        className="text-[13px] font-medium text-accent hover:underline"
      >
        ← Danh sách phòng ban
      </Link>

      <div className="mt-6">
        <FormMessage
          message={
            error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server) : undefined
          }
        />
      </div>

      <form action={createDepartment} className="max-w-[860px] space-y-8">
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
            placeholder="Ví dụ: Dược lâm sàng"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
          <button
            type="submit"
            className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
          >
            Tạo phòng ban
          </button>
          <Link
            href="/departments"
            className="border border-rule px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-ink"
          >
            Huỷ
          </Link>
        </div>
      </form>
    </WorkspacePage>
  );
}

export default function NewDepartmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewDepartmentForm searchParams={searchParams} />
    </Suspense>
  );
}
