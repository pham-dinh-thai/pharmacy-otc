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
  CUSTOMER_DELETED_FILTERS,
  customerFullName,
  customerGenderLabel,
  customerStateLabel,
  formatCustomerBirthDate,
  formatCustomerDate,
  isCustomerDeleted,
  type CustomerPage,
} from '@/lib/customers';
import {
  compactListFilters,
  first,
  listApiQuery,
  parseTriState,
} from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import { deleteCustomer, restoreCustomer } from './actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Bạn không có quyền thay đổi hồ sơ khách hàng.',
  invalid: 'Dữ liệu khách hàng không hợp lệ.',
  exists: 'Email này đã được dùng cho khách hàng khác.',
  notfound: 'Không tìm thấy khách hàng.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  created: 'Đã tạo khách hàng.',
  saved: 'Đã cập nhật hồ sơ khách hàng.',
  deleted: 'Đã xoá khách hàng. Có thể khôi phục từ danh sách.',
  restored: 'Đã khôi phục khách hàng.',
};

type ListQuery = {
  error?: string | string[];
  updated?: string | string[];
  search?: string | string[];
  deleted?: string | string[];
  page?: string | string[];
  limit?: string | string[];
};

function StateCell({ deleted }: { deleted: boolean }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${
        deleted ? 'border-red-600 text-red-700' : 'border-rule text-muted'
      }`}
    >
      {customerStateLabel(deleted)}
    </span>
  );
}

async function CustomersList({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/customers');
  if (!user.isSuperAdmin && !hasPermission(user, 'customers:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const search = first(query.search).trim();
  const deleted = parseTriState(first(query.deleted));
  const filters = compactListFilters({ search, deleted });
  const listHref = listPageHref('/customers', page, limit, filters);
  const detailHref = (id: string) =>
    `/customers/${id}?returnTo=${encodeURIComponent(listHref)}`;

  let res: Response;
  try {
    res = await authFetch(`/customers?${listApiQuery(filters, page, limit)}`);
  } catch {
    throw new Error('Failed to fetch customers: network error');
  }

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`);

  const result = (await res.json()) as CustomerPage;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/customers', totalPages, limit, filters));
  }

  const canCreate =
    user.isSuperAdmin || hasPermission(user, 'customers:create');
  const canUpdate =
    user.isSuperAdmin || hasPermission(user, 'customers:update');
  const canDelete =
    user.isSuperAdmin || hasPermission(user, 'customers:delete');

  const errorMessage = query.error
    ? (ERROR_MESSAGES[first(query.error)] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated
      ? UPDATED_MESSAGES[first(query.updated)]
      : undefined;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Khách hàng"
      intro="Danh sách hồ sơ khách hàng, thông tin liên hệ và trạng thái hồ sơ."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <ListFilterForm
        action="/customers"
        limit={limit}
        search={search}
        searchPlaceholder="Tên, email hoặc số điện thoại"
        selects={[
          {
            name: 'deleted',
            label: 'Trạng thái',
            options: CUSTOMER_DELETED_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          },
        ]}
        values={{ deleted }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} khách hàng · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm action="/customers" limit={limit} filters={filters} />

          {canCreate && (
            <Link
              href="/customers/new"
              className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Thêm khách hàng
            </Link>
          )}
        </div>
      </div>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Khách hàng</th>
                <th className={TH_CLASS}>Điện thoại</th>
                <th className={TH_CLASS}>Giới tính</th>
                <th className={TH_CLASS}>Ngày sinh</th>
                <th className={TH_CLASS}>Trạng thái</th>
                <th className={TH_CLASS}>Cập nhật lúc</th>
                {(canUpdate || canDelete) && (
                  <th className={`${TH_CLASS} text-right`}>Hành động</th>
                )}
              </tr>
            </thead>

            <tbody>
              {result.items.map((customer) => {
                const deleted = isCustomerDeleted(customer);

                return (
                  <tr key={customer.id}>
                    <td className={TD_CLASS}>
                      <Link
                        href={detailHref(customer.id)}
                        className="font-semibold hover:text-accent"
                      >
                        {customerFullName(customer)}
                      </Link>
                      <p className="mt-1 text-[12px] text-muted">
                        {customer.email}
                      </p>
                    </td>
                    <td className={TD_CLASS}>
                      <p>{customer.primaryPhone || '—'}</p>
                      {customer.phoneCount > 1 && (
                        <p className="mt-1 text-[12px] text-muted">
                          +{customer.phoneCount - 1} số khác
                        </p>
                      )}
                    </td>
                    <td className={TD_CLASS}>
                      {customerGenderLabel(customer.gender)}
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap`}>
                      {formatCustomerBirthDate(customer.dateOfBirth)}
                    </td>
                    <td className={TD_CLASS}>
                      <StateCell deleted={deleted} />
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                      {formatCustomerDate(customer.updatedAt)}
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className={`${TD_CLASS} text-right`}>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={detailHref(customer.id)}
                            className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                          >
                            Chi tiết
                          </Link>

                          {canUpdate && !deleted && (
                            <Link
                              href={detailHref(customer.id)}
                              className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                            >
                              Sửa
                            </Link>
                          )}

                          {canDelete && (
                            <form
                              action={
                                deleted ? restoreCustomer : deleteCustomer
                              }
                            >
                              <input
                                type="hidden"
                                name="customerId"
                                value={customer.id}
                              />
                              <input
                                type="hidden"
                                name="returnTo"
                                value={listHref}
                              />
                              <button
                                type="submit"
                                aria-label={`${deleted ? 'Khôi phục' : 'Xoá'} khách hàng ${customerFullName(customer)}`}
                                className={
                                  deleted
                                    ? 'whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper'
                                    : 'whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700'
                                }
                              >
                                {deleted ? 'Khôi phục' : 'Xoá'}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Không có khách hàng nào phù hợp với bộ lọc.
        </p>
      )}

      <PaginationNav
        path="/customers"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang khách hàng"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <CustomersList searchParams={searchParams} />
    </Suspense>
  );
}
