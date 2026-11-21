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
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_STATUS_FILTERS,
  expenseCategoryLabel,
  expenseStatusLabel,
  formatExpenseDate,
  formatExpenseTimestamp,
  type ExpensePage,
  type ExpenseStatus,
} from '@/lib/expenses';
import {
  fetchSupplierOptions,
  type SupplierOption,
} from '@/lib/goods-receipts';
import { first, listApiQuery } from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import { formatVND } from '@/lib/utils';
import {
  approveExpense,
  cancelExpense,
  payExpense,
  paySupplierExpense,
} from './actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin phiếu chi.',
  forbidden: 'Bạn không có quyền thay đổi phiếu chi.',
  invalid: 'Dữ liệu phiếu chi không hợp lệ. Kiểm tra lại các trường đã nhập.',
  conflict: 'Phiếu chi không còn ở trạng thái cho phép thao tác.',
  notfound: 'Không tìm thấy phiếu chi.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  created: 'Đã tạo phiếu chi.',
  saved: 'Đã cập nhật phiếu chi.',
  approved: 'Đã duyệt phiếu chi.',
  supplier_paid: 'Đã ghi nhận trả tiền cho nhà cung cấp.',
  paid: 'Đã ghi nhận chi tiền.',
  cancelled: 'Đã huỷ phiếu chi.',
};

type ListQuery = {
  error?: string | string[];
  updated?: string | string[];
  search?: string | string[];
  status?: string | string[];
  category?: string | string[];
  page?: string | string[];
  limit?: string | string[];
};

function StatusCell({ status }: { status: ExpenseStatus }) {
  const tone =
    status === 'paid'
      ? 'border-emerald-700 text-emerald-800'
      : status === 'supplier_paid'
        ? 'border-sky-700 text-sky-800'
        : status === 'cancelled'
          ? 'border-red-600 text-red-700'
          : status === 'approved'
            ? 'border-accent text-accent'
            : 'border-amber-700 text-amber-800';

  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${tone}`}
    >
      {expenseStatusLabel(status)}
    </span>
  );
}

function ActionButtons({
  expenseId,
  status,
  returnTo,
  canApprove,
  canPay,
  canCancel,
}: {
  expenseId: string;
  status: ExpenseStatus;
  returnTo: string;
  canApprove: boolean;
  canPay: boolean;
  canCancel: boolean;
}) {
  const canAct =
    (status === 'pending' && (canApprove || canCancel)) ||
    (status === 'approved' && (canPay || canCancel)) ||
    (status === 'supplier_paid' && canPay);

  if (!canAct) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status === 'pending' && canApprove && (
        <form action={approveExpense}>
          <input type="hidden" name="expenseId" value={expenseId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            className="whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper"
          >
            Duyệt
          </button>
        </form>
      )}

      {status === 'approved' && canPay && (
        <form action={paySupplierExpense}>
          <input type="hidden" name="expenseId" value={expenseId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            className="whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper"
          >
            Trả NCC
          </button>
        </form>
      )}

      {status === 'supplier_paid' && canPay && (
        <form action={payExpense}>
          <input type="hidden" name="expenseId" value={expenseId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            className="whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper"
          >
            Chi tiền
          </button>
        </form>
      )}

      {(status === 'pending' || status === 'approved') && canCancel && (
        <form action={cancelExpense}>
          <input type="hidden" name="expenseId" value={expenseId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            className="whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700"
          >
            Huỷ
          </button>
        </form>
      )}
    </div>
  );
}

async function ExpensesList({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/expenses');
  if (!user.isSuperAdmin && !hasPermission(user, 'expenses:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const search = first(query.search).trim();
  const status = first(query.status);
  const category = first(query.category);
  const filters = {
    ...(search ? { search } : {}),
    ...(EXPENSE_STATUS_FILTERS.some((item) => item.value === status) &&
    status !== 'all'
      ? { status }
      : {}),
    ...(EXPENSE_CATEGORY_OPTIONS.some((item) => item.value === category)
      ? { category }
      : {}),
  };
  const listHref = listPageHref('/expenses', page, limit, filters);
  const detailHref = (id: string) =>
    `/expenses/${id}?returnTo=${encodeURIComponent(listHref)}`;

  let res: Response;
  try {
    res = await authFetch(`/expenses?${listApiQuery(filters, page, limit)}`);
  } catch {
    throw new Error('Failed to fetch expenses: network error');
  }

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch expenses: ${res.status}`);

  const result = (await res.json()) as ExpensePage;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/expenses', totalPages, limit, filters));
  }

  const supplierOptions: SupplierOption[] = await fetchSupplierOptions();
  const supplierNames = new Map(
    supplierOptions.map((supplier) => [supplier.id, supplier.name]),
  );

  const canCreate = user.isSuperAdmin || hasPermission(user, 'expenses:create');
  const canApprove =
    user.isSuperAdmin || hasPermission(user, 'expenses:approve');
  const canPay = user.isSuperAdmin || hasPermission(user, 'expenses:pay');
  const canCancel = user.isSuperAdmin || hasPermission(user, 'expenses:cancel');

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
      title="Phiếu chi"
      intro="Theo dõi chi phí vận hành, duyệt phiếu và ghi nhận chi tiền."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <ListFilterForm
        action="/expenses"
        limit={limit}
        search={search}
        searchPlaceholder="Tên chi phí hoặc ghi chú"
        selects={[
          {
            name: 'status',
            label: 'Trạng thái',
            options: EXPENSE_STATUS_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          },
          {
            name: 'category',
            label: 'Danh mục',
            options: [
              { value: '', label: 'Tất cả' },
              ...EXPENSE_CATEGORY_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ],
          },
        ]}
        values={{ status, category }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} phiếu · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm action="/expenses" limit={limit} filters={filters} />

          {canCreate && (
            <Link
              href="/expenses/new"
              className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Tạo phiếu chi
            </Link>
          )}
        </div>
      </div>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Tên chi phí</th>
                <th className={TH_CLASS}>Danh mục</th>
                <th className={TH_CLASS}>Ngày chi</th>
                <th className={`${TH_CLASS} text-right`}>Số tiền</th>
                <th className={TH_CLASS}>Nhà cung cấp</th>
                <th className={TH_CLASS}>Trạng thái</th>
                <th className={TH_CLASS}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {result.items.map((expense) => (
                <tr key={expense.id}>
                  <td className={TD_CLASS}>
                    <Link
                      href={detailHref(expense.id)}
                      className="font-semibold text-accent hover:underline"
                    >
                      {expense.name}
                    </Link>
                    {expense.note && (
                      <p className="mt-1 text-[12px] text-muted">
                        {expense.note}
                      </p>
                    )}
                  </td>
                  <td className={TD_CLASS}>
                    {expenseCategoryLabel(expense.category)}
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap`}>
                    {formatExpenseDate(expense.expenseDate)}
                  </td>
                  <td
                    className={`${TD_CLASS} whitespace-nowrap text-right tabular-nums`}
                  >
                    {formatVND(expense.amount)}
                  </td>
                  <td className={TD_CLASS}>
                    {expense.supplierId
                      ? (supplierNames.get(expense.supplierId) ?? '—')
                      : '—'}
                  </td>
                  <td className={TD_CLASS}>
                    <StatusCell status={expense.status} />
                    <p className="mt-1 text-[11px] text-muted">
                      {formatExpenseTimestamp(expense.createdAt)}
                    </p>
                  </td>
                  <td className={`${TD_CLASS} text-right`}>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={detailHref(expense.id)}
                        className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                      >
                        Chi tiết
                      </Link>
                      <ActionButtons
                        expenseId={expense.id}
                        status={expense.status}
                        returnTo={listHref}
                        canApprove={canApprove}
                        canPay={canPay}
                        canCancel={canCancel}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Không có phiếu chi nào phù hợp với bộ lọc.
        </p>
      )}

      <PaginationNav
        path="/expenses"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang phiếu chi"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <ExpensesList searchParams={searchParams} />
    </Suspense>
  );
}
