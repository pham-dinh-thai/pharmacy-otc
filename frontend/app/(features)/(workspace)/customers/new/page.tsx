import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { createCustomer } from '../actions';
import { CustomerForm, EMPTY_CUSTOMER_FORM } from '../customer-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập đầy đủ họ tên, email, mật khẩu, số điện thoại và địa chỉ.',
  invalid: 'Dữ liệu khách hàng không hợp lệ. Kiểm tra lại các trường đã nhập.',
  exists: 'Email này đã được dùng cho khách hàng khác.',
  forbidden: 'Bạn không có quyền tạo khách hàng.',
  notfound: 'Không tìm thấy khách hàng.',
  server: 'Không tạo được khách hàng. Kiểm tra kết nối rồi thử lại.',
};

async function NewCustomerForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/customers/new');
  if (!user.isSuperAdmin && !hasPermission(user, 'customers:create')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const rawError = Array.isArray(query.error) ? query.error[0] : query.error;
  const errorMessage = rawError
    ? (ERROR_MESSAGES[rawError] ?? ERROR_MESSAGES.server)
    : undefined;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Thêm khách hàng"
      intro="Tạo hồ sơ khách hàng kèm tài khoản đăng nhập."
    >
      <div className="mb-6">
        <Link
          href="/customers"
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách khách hàng
        </Link>
      </div>

      <FormMessage message={errorMessage} />

      <section className="border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Hồ sơ khách hàng</h2>
          <p className="mt-1 text-[13px] text-muted">
            Khách sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
          </p>
        </div>

        <CustomerForm
          action={createCustomer}
          values={EMPTY_CUSTOMER_FORM}
          submitLabel="Tạo khách hàng"
          cancelHref="/customers"
          showPassword
        />
      </section>
    </WorkspacePage>
  );
}

export default function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewCustomerForm searchParams={searchParams} />
    </Suspense>
  );
}
