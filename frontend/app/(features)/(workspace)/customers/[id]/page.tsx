import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  customerFullName,
  customerGenderLabel,
  customerStateLabel,
  formatCustomerBirthDate,
  formatCustomerDate,
  isCustomerDeleted,
  toDateInputValue,
  type CustomerDetail,
} from '@/lib/customers';
import {
  deleteCustomer,
  restoreCustomer,
  updateCustomer,
} from '../actions';
import { CustomerForm } from '../customer-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin khách hàng.',
  forbidden: 'Bạn không có quyền thay đổi hồ sơ khách hàng.',
  invalid: 'Dữ liệu khách hàng không hợp lệ. Kiểm tra lại các trường đã nhập.',
  exists: 'Email này đã được dùng cho khách hàng khác.',
  notfound: 'Không tìm thấy khách hàng.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  saved: 'Đã cập nhật hồ sơ khách hàng.',
  deleted: 'Đã xoá khách hàng. Có thể khôi phục từ danh sách.',
  restored: 'Đã khôi phục khách hàng.',
};

type DetailQuery = {
  error?: string | string[];
  updated?: string | string[];
  returnTo?: string | string[];
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';

  return value ?? '';
}

async function CustomerDetailPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/customers');
  if (!user.isSuperAdmin && !hasPermission(user, 'customers:read')) {
    redirect('/dashboard');
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = first(query.returnTo);
  const listReturnPath =
    returnTo.startsWith('/customers') && !returnTo.startsWith('/customers/')
      ? returnTo
      : '/customers';

  let res: Response;
  try {
    res = await authFetch(`/customers/${encodeURIComponent(id)}`);
  } catch {
    throw new Error('Failed to fetch customer: network error');
  }

  if (res.status === 404) notFound();
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(`/customers/${id}`)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch customer: ${res.status}`);

  const customer = (await res.json()) as CustomerDetail;
  const deleted = isCustomerDeleted(customer);
  const canUpdate =
    user.isSuperAdmin || hasPermission(user, 'customers:update');
  const canDelete =
    user.isSuperAdmin || hasPermission(user, 'customers:delete');
  const locked = !canUpdate || deleted;

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
      title="Chi tiết khách hàng"
      intro={`Hồ sơ của ${customerFullName(customer)}.`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={listReturnPath}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách khách hàng
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canDelete &&
            (deleted ? (
              <form action={restoreCustomer}>
                <input type="hidden" name="customerId" value={customer.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="border border-accent px-4 py-2.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-paper"
                >
                  Khôi phục
                </button>
              </form>
            ) : (
              <form action={deleteCustomer}>
                <input type="hidden" name="customerId" value={customer.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="border border-rule px-4 py-2.5 text-[13px] font-medium text-muted transition-colors hover:border-red-600 hover:text-red-700"
                >
                  Xoá
                </button>
              </form>
            ))}
        </div>
      </div>

      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      {deleted && (
        <div className="mb-6 border border-red-600 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Khách hàng này đã được xoá. Khôi phục để tiếp tục sử dụng.
        </div>
      )}

      <section className="border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Hồ sơ khách hàng</h2>
          <p className="mt-1 text-[13px] text-muted">
            {customer.email} · Giới tính: {customerGenderLabel(customer.gender)} ·
            Ngày sinh: {formatCustomerBirthDate(customer.dateOfBirth)} ·
            Trạng thái: {customerStateLabel(deleted)}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            Tạo lúc: {formatCustomerDate(customer.createdAt)} · Cập nhật lúc:{' '}
            {formatCustomerDate(customer.updatedAt)}
          </p>
        </div>

        <CustomerForm
          action={updateCustomer}
          values={{
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            gender: customer.gender ?? '',
            dateOfBirth: toDateInputValue(customer.dateOfBirth),
            phones: customer.phones.map((phone) => ({
              phone: phone.phone,
              isPrimary: phone.isPrimary,
            })),
            addresses: customer.addresses.map((address) => ({
              address: address.address,
              isDefault: address.isDefault,
            })),
          }}
          submitLabel="Lưu thay đổi"
          cancelHref={listReturnPath}
          customerId={customer.id}
          returnTo={listReturnPath}
          locked={locked}
        />
      </section>
    </WorkspacePage>
  );
}

export default function CustomerDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  return <CustomerDetailPageContent {...props} />;
}
