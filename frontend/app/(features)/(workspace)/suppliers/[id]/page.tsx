import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  formatSupplierDate,
  isSupplierDeleted,
  supplierContact,
  supplierStateLabel,
  type Supplier,
} from '@/lib/suppliers';
import {
  deleteSupplier,
  restoreSupplier,
  updateSupplier,
} from '../actions';

const FIELD_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';
const LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin nhà cung cấp.',
  forbidden: 'Bạn không có quyền thay đổi nhà cung cấp.',
  invalid: 'Dữ liệu nhà cung cấp không hợp lệ.',
  exists: 'Mã hoặc thông tin liên hệ đã được dùng cho nhà cung cấp khác.',
  notfound: 'Không tìm thấy nhà cung cấp.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};
const UPDATED_MESSAGES: Record<string, string> = {
  saved: 'Đã cập nhật nhà cung cấp.',
  deleted: 'Đã xoá nhà cung cấp. Có thể khôi phục từ danh sách.',
  restored: 'Đã khôi phục nhà cung cấp.',
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

async function SupplierDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/suppliers');
  if (!user.isSuperAdmin && !hasPermission(user, 'suppliers:read')) {
    redirect('/dashboard');
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = first(query.returnTo) || '/suppliers';
  const listReturnPath =
    returnTo.startsWith('/suppliers') && !returnTo.startsWith('/suppliers/')
      ? returnTo
      : '/suppliers';

  let res: Response;
  try {
    res = await authFetch(`/suppliers/${encodeURIComponent(id)}`);
  } catch {
    throw new Error('Failed to fetch supplier: network error');
  }

  if (res.status === 404) notFound();
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(`/suppliers/${id}`)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch supplier: ${res.status}`);

  const supplier = (await res.json()) as Supplier;
  const deleted = isSupplierDeleted(supplier);
  const canUpdate =
    user.isSuperAdmin || hasPermission(user, 'suppliers:update');
  const canDelete =
    user.isSuperAdmin || hasPermission(user, 'suppliers:delete');
  const editable = canUpdate && !deleted;

  const errorMessage = query.error
    ? (ERROR_MESSAGES[first(query.error)] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated
      ? UPDATED_MESSAGES[first(query.updated)]
      : undefined;

  const field = (
    name: string,
    label: string,
    defaultValue: string | number | null,
    options?: {
      required?: boolean;
      type?: string;
      placeholder?: string;
      readOnly?: boolean;
    },
  ) => (
    <div key={name}>
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={options?.type ?? 'text'}
        defaultValue={defaultValue ?? ''}
        required={options?.required}
        disabled={!editable}
        readOnly={options?.readOnly}
        placeholder={options?.placeholder}
        className={`${FIELD_CLASS} disabled:bg-rule/30`}
      />
    </div>
  );

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Chi tiết nhà cung cấp"
      intro={`Thông tin và hồ sơ nhà cung cấp ${supplier.code}.`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={listReturnPath}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách nhà cung cấp
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canDelete &&
            (deleted ? (
              <form action={restoreSupplier}>
                <input type="hidden" name="supplierId" value={supplier.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="border border-accent px-4 py-2.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-paper"
                >
                  Khôi phục
                </button>
              </form>
            ) : (
              <form action={deleteSupplier}>
                <input type="hidden" name="supplierId" value={supplier.id} />
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
          Nhà cung cấp này đã được xoá. Khôi phục để tiếp tục sử dụng.
        </div>
      )}

      <section className="border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Thông tin nhà cung cấp</h2>
          <p className="mt-1 text-[13px] text-muted">
            Mã: {supplier.code} · Trạng thái: {supplierStateLabel(deleted)}
          </p>
        </div>

        <form action={updateSupplier} className="grid gap-5 px-6 py-6 md:grid-cols-2">
          <input type="hidden" name="supplierId" value={supplier.id} />
          <input type="hidden" name="returnTo" value={listReturnPath} />

          <FormMessage message={errorMessage} />
          <FormMessage message={updatedMessage} tone="success" />

          {field('code', 'Mã nhà cung cấp', supplier.code, { readOnly: true })}
          {field('name', 'Tên nhà cung cấp', supplier.name, { required: true })}
          {field('phone', 'Điện thoại', supplier.phone)}
          {field('email', 'Email', supplier.email, { type: 'email' })}
          {field('address', 'Địa chỉ', supplier.address)}
          {field('taxCode', 'Mã số thuế', supplier.taxCode)}

          <div className="md:col-span-2">
            <p className="text-[12px] text-muted">
              Liên hệ: {supplierContact(supplier) ?? '—'} · Tạo lúc:{' '}
              {formatSupplierDate(supplier.createdAt)}
            </p>
          </div>

          {canUpdate && (
            <div className="flex flex-wrap items-center gap-4 md:col-span-2">
              <button
                type="submit"
                disabled={deleted}
                className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Lưu thay đổi
              </button>
              {deleted && (
                <span className="text-[12px] text-muted">
                  Không thể chỉnh sửa nhà cung cấp đã xoá.
                </span>
              )}
            </div>
          )}
        </form>
      </section>
    </WorkspacePage>
  );
}

export default function SupplierDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  return <SupplierDetail {...props} />;
}
