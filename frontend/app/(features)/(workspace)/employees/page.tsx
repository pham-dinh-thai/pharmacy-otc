import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { ListFilterForm } from '@/components/pagination/ListFilterForm';
import { PageSizeForm } from '@/components/pagination/PageSizeForm';
import { PaginationNav } from '@/components/pagination/PaginationNav';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  EMPLOYEE_POSITIONS,
  EMPLOYEE_STATUS_LABELS,
  type EmployeeDepartmentOption,
  type EmployeePage,
  type EmployeeStatus,
  isEmployeePosition,
} from '@/lib/employees';
import {
  compactListFilters,
  first,
  listApiQuery,
} from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import { resignEmployee } from './actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

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

const STATUS_CLASS: Record<EmployeeStatus, string> = {
  working: 'border-accent bg-accent-soft text-accent',
  pregnant: 'border-amber-500 bg-amber-50 text-amber-700',
  resigned: 'border-rule text-muted',
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${STATUS_CLASS[status]}`}
    >
      {EMPLOYEE_STATUS_LABELS[status]}
    </span>
  );
}

async function EmployeesList({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    updated?: string;
    search?: string | string[];
    departmentId?: string | string[];
    position?: string | string[];
    status?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/employees');
  if (!user.isSuperAdmin && !hasPermission(user, 'employees:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const search = first(query.search).trim();
  const rawDepartmentId = first(query.departmentId);
  const rawPosition = first(query.position);
  const rawStatus = first(query.status);
  const departmentId = isUuid(rawDepartmentId) ? rawDepartmentId : '';
  const position = isEmployeePosition(rawPosition) ? rawPosition : '';
  const status =
    rawStatus in EMPLOYEE_STATUS_LABELS ? (rawStatus as EmployeeStatus) : '';
  const filters = compactListFilters({
    search,
    departmentId,
    position,
    status,
  });
  const listHref = listPageHref('/employees', page, limit, filters);
  const [res, departmentRes] = await Promise.all([
    authFetch(`/employees?${listApiQuery(filters, page, limit)}`),
    authFetch('/employees/departments'),
  ]);

  if (res.status === 401 || departmentRes.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403 || departmentRes.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch employees: ${res.status}`);
  if (!departmentRes.ok) {
    throw new Error(`Failed to fetch departments: ${departmentRes.status}`);
  }

  const departmentOptions: EmployeeDepartmentOption[] =
    await departmentRes.json();
  const result = (await res.json()) as EmployeePage;
  const employees = result.items;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/employees', totalPages, limit, filters));
  }
  const canCreate =
    user.isSuperAdmin || hasPermission(user, 'employees:create');
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
      eyebrow="Không gian làm việc"
      title="Nhân viên"
      intro="Danh sách nhân viên, phòng ban công tác và trạng thái làm việc."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <ListFilterForm
        action="/employees"
        limit={limit}
        search={search}
        searchPlaceholder="Tên hoặc email nhân viên"
        selects={[
          {
            name: 'departmentId',
            label: 'Phòng ban',
            options: [
              { value: '', label: 'Tất cả' },
              ...departmentOptions.map((department) => ({
                value: department.id,
                label: department.name,
              })),
            ],
          },
          {
            name: 'position',
            label: 'Chức danh',
            options: [
              { value: '', label: 'Tất cả' },
              ...EMPLOYEE_POSITIONS.map((item) => ({ value: item, label: item })),
            ],
          },
          {
            name: 'status',
            label: 'Trạng thái',
            options: [
              { value: '', label: 'Tất cả' },
              ...Object.entries(EMPLOYEE_STATUS_LABELS).map(
                ([value, label]) => ({ value, label }),
              ),
            ],
          },
        ]}
        values={{ departmentId, position, status }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} nhân viên · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm action="/employees" limit={limit} filters={filters} />

          {canCreate && (
            <Link
              href="/employees/new"
              className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Thêm nhân viên
            </Link>
          )}
        </div>
      </div>

      {employees.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Nhân viên</th>
                <th className={TH_CLASS}>Phòng ban / Chức danh</th>
                <th className={TH_CLASS}>Trạng thái</th>
                <th className={TH_CLASS}>Cập nhật lúc</th>
                {(canUpdate || canDelete) && (
                  <th className={`${TH_CLASS} text-right`}>Hành động</th>
                )}
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className={TD_CLASS}>
                    <Link
                      href={`/employees/${employee.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {employee.firstName} {employee.lastName}
                    </Link>
                    <p className="mt-1 text-[12px] text-muted">{employee.email}</p>
                  </td>

                  <td className={TD_CLASS}>
                    <p>{employee.departmentName}</p>
                    <p className="mt-1 text-[12px] text-muted">
                      {employee.position ?? 'Chưa xác định chức danh'}
                    </p>
                  </td>

                  <td className={TD_CLASS}>
                    <StatusBadge status={employee.status} />
                  </td>

                  <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                    {formatDate(employee.updatedAt)}
                  </td>

                  {(canUpdate || canDelete) && (
                    <td className={`${TD_CLASS} text-right`}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {canUpdate && (
                          <Link
                            href={`/employees/${employee.id}`}
                            className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                          >
                            Sửa
                          </Link>
                        )}

                        {canDelete && employee.status !== 'resigned' && (
                          <form action={resignEmployee}>
                            <input
                              type="hidden"
                              name="employeeId"
                              value={employee.id}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={listHref}
                            />
                            <button
                              type="submit"
                              aria-label={`Ghi nhận nghỉ việc cho ${employee.firstName} ${employee.lastName}`}
                              className="whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700"
                            >
                              Nghỉ việc
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Chưa có nhân viên nào trong danh sách.
        </p>
      )}

      <PaginationNav
        path="/employees"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang nhân viên"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    updated?: string;
    search?: string | string[];
    departmentId?: string | string[];
    position?: string | string[];
    status?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <EmployeesList searchParams={searchParams} />
    </Suspense>
  );
}
