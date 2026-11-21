import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  expenseCategoryLabel,
  expenseStatusLabel,
  formatExpenseDate,
  formatExpenseTimestamp,
  paymentMethodLabel,
  type Expense,
  type ExpenseStatus,
} from '@/lib/expenses';
import { fetchSupplierOptions } from '@/lib/goods-receipts';
import { first } from '@/lib/list-filters';
import { formatVND } from '@/lib/utils';
import {
  approveExpense,
  cancelExpense,
  payExpense,
  paySupplierExpense,
  updateExpense,
} from '../actions';
import { ExpenseForm, expenseFormValues } from '../expense-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin phiếu chi.',
  forbidden: 'Bạn không có quyền thay đổi phiếu chi.',
  invalid: 'Dữ liệu phiếu chi không hợp lệ. Kiểm tra lại các trường đã nhập.',
  conflict: 'Phiếu chi không còn ở trạng thái cho phép thao tác.',
  notfound: 'Không tìm thấy phiếu chi.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  saved: 'Đã cập nhật phiếu chi.',
  approved: 'Đã duyệt phiếu chi.',
  supplier_paid: 'Đã ghi nhận trả tiền cho nhà cung cấp.',
  paid: 'Đã ghi nhận chi tiền.',
  cancelled: 'Đã huỷ phiếu chi.',
};

type DetailQuery = {
  error?: string | string[];
  updated?: string | string[];
  returnTo?: string | string[];
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

async function ExpenseDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/expenses');
  if (!user.isSuperAdmin && !hasPermission(user, 'expenses:read')) {
    redirect('/dashboard');
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = first(query.returnTo);
  const listReturnPath =
    returnTo.startsWith('/expenses') && !returnTo.startsWith('/expenses/')
      ? returnTo
      : '/expenses';

  let res: Response;
  try {
    res = await authFetch(`/expenses/${encodeURIComponent(id)}`);
  } catch {
    throw new Error('Failed to fetch expense: network error');
  }

  if (res.status === 404) notFound();
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(`/expenses/${id}`)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch expense: ${res.status}`);

  const expense = (await res.json()) as Expense;
  const supplierOptions = await fetchSupplierOptions();
  const supplierName = expense.supplierId
    ? (supplierOptions.find((item) => item.id === expense.supplierId)?.name ??
      '—')
    : '—';

  const canUpdate = user.isSuperAdmin || hasPermission(user, 'expenses:update');
  const canApprove =
    user.isSuperAdmin || hasPermission(user, 'expenses:approve');
  const canPay = user.isSuperAdmin || hasPermission(user, 'expenses:pay');
  const canCancel = user.isSuperAdmin || hasPermission(user, 'expenses:cancel');
  const editable = canUpdate && expense.status === 'pending';
  const showApprove = canApprove && expense.status === 'pending';
  const showPaySupplier = canPay && expense.status === 'approved';
  const showPay = canPay && expense.status === 'supplier_paid';
  const showCancel =
    canCancel &&
    (expense.status === 'pending' || expense.status === 'approved');

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
      title="Chi tiết phiếu chi"
      intro={`${expense.name} · ${formatExpenseDate(expense.expenseDate)}.`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={listReturnPath}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách phiếu chi
        </Link>

        {(showApprove || showPaySupplier || showPay || showCancel) && (
          <div className="flex flex-wrap items-center gap-2">
            {showApprove && (
              <form action={approveExpense}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
                >
                  Duyệt phiếu
                </button>
              </form>
            )}

            {showPaySupplier && (
              <form action={paySupplierExpense}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
                >
                  Trả tiền NCC
                </button>
              </form>
            )}

            {showPay && (
              <form action={payExpense}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
                >
                  Ghi nhận chi tiền
                </button>
              </form>
            )}

            {showCancel && (
              <form action={cancelExpense}>
                <input type="hidden" name="expenseId" value={expense.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="border border-rule px-4 py-2.5 text-[13px] font-medium text-muted transition-colors hover:border-red-600 hover:text-red-700"
                >
                  Huỷ phiếu
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <section className="border border-rule bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Thông tin phiếu</h2>
            <p className="mt-1 text-[13px] text-muted">
              Tạo lúc {formatExpenseTimestamp(expense.createdAt)} · Cập nhật lúc{' '}
              {formatExpenseTimestamp(expense.updatedAt)}
            </p>
          </div>
          <StatusCell status={expense.status} />
        </div>

        <dl className="grid gap-x-8 gap-y-4 px-6 py-5 text-[13px] md:grid-cols-3">
          <div>
            <dt className="text-muted">Số tiền</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {formatVND(Number(expense.amount))}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Danh mục</dt>
            <dd className="mt-1 font-medium">
              {expenseCategoryLabel(expense.category)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Ngày chi</dt>
            <dd className="mt-1 font-medium">
              {formatExpenseDate(expense.expenseDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Nhà cung cấp</dt>
            <dd className="mt-1 font-medium">{supplierName}</dd>
          </div>
          <div>
            <dt className="text-muted">Phương thức thanh toán</dt>
            <dd className="mt-1 font-medium">
              {paymentMethodLabel(expense.paymentMethod)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Người tạo</dt>
            <dd className="mt-1 break-all font-mono text-[12px]">
              {expense.createdBy}
            </dd>
          </div>
          {expense.note && (
            <div className="md:col-span-3">
              <dt className="text-muted">Ghi chú</dt>
              <dd className="mt-1 leading-6">{expense.note}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mt-8 border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Chỉnh sửa phiếu</h2>
          <p className="mt-1 text-[13px] text-muted">
            {editable
              ? 'Chỉ phiếu ở trạng thái chờ duyệt mới được chỉnh sửa.'
              : `Phiếu đang ở trạng thái ${expenseStatusLabel(expense.status)}, không thể chỉnh sửa.`}
          </p>
        </div>

        <ExpenseForm
          action={updateExpense}
          values={expenseFormValues(expense)}
          supplierOptions={supplierOptions}
          submitLabel="Lưu thay đổi"
          cancelHref={listReturnPath}
          expenseId={expense.id}
          returnTo={listReturnPath}
          disabled={!editable}
        />
      </section>
    </WorkspacePage>
  );
}

export default function ExpenseDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <ExpenseDetailContent {...props} />
    </Suspense>
  );
}
