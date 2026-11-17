import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import type { EmployeeDepartmentOption } from '@/lib/employees';
import { createEmployee } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập đầy đủ họ, tên, email, mật khẩu và phòng ban.',
  invalid: 'Dữ liệu nhân viên không hợp lệ. Kiểm tra email và mật khẩu.',
  conflict: 'Email đã được sử dụng hoặc phòng ban không còn hoạt động.',
  department: 'Phòng ban không tồn tại hoặc không còn hoạt động.',
  forbidden: 'Bạn không có quyền tạo nhân viên.',
  server: 'Không tạo được nhân viên. Kiểm tra kết nối rồi thử lại.',
};

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

async function NewEmployeeForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/employees/new');
  if (!user.isSuperAdmin && !hasPermission(user, 'employees:create')) {
    redirect('/employees');
  }

  const [res, query] = await Promise.all([
    authFetch('/employees/departments'),
    searchParams,
  ]);

  if (res.status === 401) redirect('/login?next=/employees/new');
  if (res.status === 403) redirect('/employees?error=forbidden');
  if (!res.ok) throw new Error(`Failed to fetch departments: ${res.status}`);

  const departments: EmployeeDepartmentOption[] = await res.json();

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc · Nhân viên"
      title="Thêm nhân viên"
      intro="Hồ sơ nhân viên và tài khoản đăng nhập được tạo cùng lúc. Chức danh có thể để trống."
    >
      <Link
        href="/employees"
        className="text-[13px] font-medium text-accent hover:underline"
      >
        ← Danh sách nhân viên
      </Link>

      <div className="mt-6">
        <FormMessage
          message={
            query.error ? (ERROR_MESSAGES[query.error] ?? ERROR_MESSAGES.server) : undefined
          }
        />
      </div>

      {departments.length === 0 ? (
        <p className="mt-6 max-w-[62ch] border-l-2 border-rule bg-paper px-3 py-2 text-[13px] leading-6 text-muted">
          Chưa có phòng ban nào đang hoạt động để gán cho nhân viên.
        </p>
      ) : (
        <form action={createEmployee} className="max-w-[860px] space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1.5 block text-[13px] font-medium text-muted"
              >
                Họ
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                maxLength={255}
                autoComplete="family-name"
                placeholder="Họ"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-1.5 block text-[13px] font-medium text-muted"
              >
                Tên
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                maxLength={255}
                autoComplete="given-name"
                placeholder="Tên"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-medium text-muted"
            >
              Email đăng nhập
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              placeholder="Email đăng nhập"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-medium text-muted"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className={INPUT_CLASS}
            />
            <p className="mt-1.5 text-[12px] text-muted">
              Tối thiểu 8 ký tự.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="departmentId"
                className="mb-1.5 block text-[13px] font-medium text-muted"
              >
                Phòng ban
              </label>
              <select
                id="departmentId"
                name="departmentId"
                required
                defaultValue=""
                className={INPUT_CLASS}
              >
                <option value="" disabled>
                  Chọn phòng ban
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="position"
                className="mb-1.5 block text-[13px] font-medium text-muted"
              >
                Chức danh
              </label>
              <input
                id="position"
                name="position"
                maxLength={255}
                autoComplete="organization-title"
                placeholder="Chức danh (nếu có)"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
            <button
              type="submit"
              className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Tạo nhân viên
            </button>
            <Link
              href="/employees"
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

export default function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewEmployeeForm searchParams={searchParams} />
    </Suspense>
  );
}
