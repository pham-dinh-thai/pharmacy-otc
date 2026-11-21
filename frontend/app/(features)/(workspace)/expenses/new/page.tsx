import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { first } from '@/lib/list-filters';
import { fetchSupplierOptions } from '@/lib/goods-receipts';
import { createExpense } from '../actions';
import { ExpenseForm, expenseFormValues } from '../expense-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Điền tên, danh mục, số tiền và ngày chi.',
  invalid: 'Dữ liệu phiếu chi không hợp lệ. Kiểm tra lại các trường đã nhập.',
  forbidden: 'Bạn không có quyền tạo phiếu chi.',
  notfound: 'Không tìm thấy nhà cung cấp đã chọn.',
  server: 'Không tạo được phiếu chi. Kiểm tra kết nối rồi thử lại.',
};

type NewQuery = {
  error?: string | string[];
};

async function NewExpenseForm({
  searchParams,
}: {
  searchParams: Promise<NewQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/expenses/new');
  if (!user.isSuperAdmin && !hasPermission(user, 'expenses:create')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const rawError = first(query.error);
  const errorMessage = rawError
    ? (ERROR_MESSAGES[rawError] ?? ERROR_MESSAGES.server)
    : undefined;

  const supplierOptions = await fetchSupplierOptions();

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Tạo phiếu chi"
      intro="Lập phiếu ở trạng thái chờ duyệt. Phiếu chỉ được chi tiền sau khi duyệt."
    >
      <div className="mb-6">
        <Link
          href="/expenses"
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách phiếu chi
        </Link>
      </div>

      <FormMessage message={errorMessage} />

      <section className="border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Thông tin phiếu chi</h2>
          <p className="mt-1 text-[13px] text-muted">
            Số tiền tính bằng VND, nhập số nguyên không có dấu phân cách.
          </p>
        </div>

        <ExpenseForm
          action={createExpense}
          values={expenseFormValues()}
          supplierOptions={supplierOptions}
          submitLabel="Tạo phiếu chi"
          cancelHref="/expenses"
        />
      </section>
    </WorkspacePage>
  );
}

export default function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<NewQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewExpenseForm searchParams={searchParams} />
    </Suspense>
  );
}
