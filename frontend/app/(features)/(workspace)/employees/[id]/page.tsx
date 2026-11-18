import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  EMPLOYEE_POSITIONS,
  EMPLOYEE_STATUS_LABELS,
  MANAGEABLE_EMPLOYEE_STATUSES,
  type Employee,
  type EmployeeDepartmentOption,
} from '@/lib/employees';
import {
  changeEmployeeStatus,
  resignEmployee,
  updateEmployee,
} from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Không tìm thấy nhân viên hoặc phòng ban.',
  forbidden: 'Bạn không có quyền thay đổi hồ sơ nhân viên.',
  invalid: 'Dữ liệu nhân viên không hợp lệ.',
  conflict: 'Email đã được sử dụng hoặc phòng ban không còn hoạt động.',
  department: 'Phòng ban không tồn tại hoặc không còn hoạt động.',
  alreadyResigned: 'Nhân viên này đã nghỉ việc.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  saved: 'Đã cập nhật hồ sơ nhân viên.',
  status: 'Đã cập nhật trạng thái nhân viên.',
  resigned: 'Đã ghi nhận nghỉ việc.',
};

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

function formatDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

async function EmployeeDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const user = await fetchCurrentUser();
  const next = `/employees/${id}`;

  if (!user) redirect(`/login?next=${next}`);
  if (!user.isSuperAdmin && !hasPermission(user, 'employees:read')) {
    redirect('/dashboard');
  }

  const [res, optionsRes, query] = await Promise.all([
    authFetch(`/employees/${id}`),
    authFetch('/employees/departments'),
    searchParams,
  ]);

  if (res.status === 401 || optionsRes.status === 401) {
    redirect(`/login?next=${next}`);
  }
  if (res.status === 403 || optionsRes.status === 403) redirect('/dashboard');
  if (res.status === 400 || res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch employee: ${res.status}`);
  if (!optionsRes.ok) {
    throw new Error(`Failed to fetch departments: ${optionsRes.status}`);
  }

  const employee: Employee = await res.json();
  const departments: EmployeeDepartmentOption[] = await optionsRes.json();
  const currentDepartmentActive = departments.some(
    (department) => department.id === employee.departmentId,
  );

  const canUpdate =
    user.isSuperAdmin || hasPermission(user, 'employees:update');
  const canDelete =
    user.isSuperAdmin || hasPermission(user, 'employees:delete');

  const errorMessage = query.error
    ? (ERROR_MESSAGES[query.error] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated
      ? UPDATED_MESSAGES[query.updated]
      : undefined;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc · Nhân viên"
      title={`${employee.firstName} ${employee.lastName}`}
      intro="Hồ sơ nhân sự, phòng ban công tác và trạng thái làm việc."
    >
      <Link
        href="/employees"
        className="text-[13px] font-medium text-accent hover:underline"
      >
        ← Danh sách nhân viên
      </Link>

      <div className="mt-6">
        <FormMessage message={errorMessage} />
        <FormMessage message={updatedMessage} tone="success" />
      </div>

      <section className="max-w-[860px]">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Thông tin hồ sơ
          </h2>
          <span className="text-[12px] tabular-nums text-muted">
            {EMPLOYEE_STATUS_LABELS[employee.status]}
          </span>
        </div>

        <dl className="divide-y divide-rule border-b border-rule text-[13px]">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Email đăng nhập</dt>
            <dd className="text-right">{employee.email}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Trạng thái tài khoản</dt>
            <dd className="text-right">
              {employee.isActive ? 'Đang hoạt động' : 'Đã khoá'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Tạo lúc</dt>
            <dd className="text-right tabular-nums">
              {formatDate(employee.createdAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">Cập nhật lúc</dt>
            <dd className="text-right tabular-nums">
              {formatDate(employee.updatedAt)}
            </dd>
          </div>
        </dl>
      </section>

      {canUpdate && (
        <section className="mt-10 max-w-[860px]">
          <h2 className="border-b border-rule pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Phòng ban và chức danh
          </h2>

          {!currentDepartmentActive && (
            <p className="mt-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-[13px] leading-6 text-amber-700">
              Phòng ban hiện tại không còn hoạt động. Chọn phòng ban khác để
              lưu thay đổi.
            </p>
          )}

          <form action={updateEmployee} className="mt-6 space-y-6">
            <input type="hidden" name="employeeId" value={employee.id} />
            <input type="hidden" name="returnTo" value={next} />

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
                  defaultValue={employee.departmentId}
                  className={INPUT_CLASS}
                >
                  {!currentDepartmentActive && (
                    <option value={employee.departmentId}>
                      {employee.departmentName} (không còn hoạt động)
                    </option>
                  )}
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
                <select
                  id="position"
                  name="position"
                  defaultValue={employee.position ?? ''}
                  className={INPUT_CLASS}
                >
                  <option value="">Chưa xác định</option>
                  {EMPLOYEE_POSITIONS.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Lưu thay đổi
            </button>
          </form>
        </section>
      )}

      {canUpdate && employee.status !== 'resigned' && (
        <section className="mt-10 max-w-[860px]">
          <h2 className="border-b border-rule pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Trạng thái làm việc
          </h2>

          <form action={changeEmployeeStatus} className="mt-6">
            <input type="hidden" name="employeeId" value={employee.id} />
            <input type="hidden" name="returnTo" value={next} />

            <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_auto] sm:items-end">
              <div>
                <label
                  htmlFor="status"
                  className="mb-1.5 block text-[13px] font-medium text-muted"
                >
                  Trạng thái
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  defaultValue={employee.status}
                  className={INPUT_CLASS}
                >
                  {MANAGEABLE_EMPLOYEE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {EMPLOYEE_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="border border-accent px-5 py-2.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-paper"
              >
                Cập nhật trạng thái
              </button>
            </div>

            <p className="mt-3 text-[12px] leading-5 text-muted">
              Trạng thái thai sản không chặn đăng nhập. Chỉ trạng thái đã nghỉ
              việc mới chặn đăng nhập và làm mới phiên.
            </p>
          </form>
        </section>
      )}

      {canDelete && employee.status !== 'resigned' && (
        <section className="mt-10 max-w-[860px] border-t border-rule pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Nghỉ việc
          </h2>

          <p className="mt-3 max-w-[62ch] text-[13px] leading-6 text-muted">
            Ghi nhận nhân viên nghỉ việc. Hồ sơ vẫn được lưu; tài khoản đăng
            nhập sẽ bị vô hiệu hoá.
          </p>

          <form action={resignEmployee} className="mt-4">
            <input type="hidden" name="employeeId" value={employee.id} />
            <input type="hidden" name="returnTo" value={next} />
            <button
              type="submit"
              className="border border-red-600 px-3 py-1.5 text-[12px] font-semibold text-red-700 transition-colors hover:bg-red-600 hover:text-paper"
            >
              Ghi nhận nghỉ việc
            </button>
          </form>
        </section>
      )}
    </WorkspacePage>
  );
}

export default function EmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <EmployeeDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}
