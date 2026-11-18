import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { createSupplier } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Dữ liệu nhà cung cấp không hợp lệ.',
  exists: 'Thông tin liên hệ hoặc mã số thuế đã được dùng cho nhà cung cấp khác.',
  forbidden: 'Bạn không có quyền tạo nhà cung cấp.',
  notfound: 'Không tìm thấy nhà cung cấp.',
  server: 'Không tạo được nhà cung cấp. Kiểm tra kết nối rồi thử lại.',
};

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

async function NewSupplierForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/suppliers/new');
  if (!user.isSuperAdmin && !hasPermission(user, 'suppliers:create')) {
    redirect('/suppliers');
  }

  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc · Nhà cung cấp"
      title="Thêm nhà cung cấp"
      intro="Nhập thông tin liên hệ của nhà cung cấp. Các trường không bắt buộc có thể để trống."
    >
      <Link
        href="/suppliers"
        className="text-[13px] font-medium text-accent hover:underline"
      >
        ← Danh sách nhà cung cấp
      </Link>

      <div className="mt-6">
        <FormMessage
          message={error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server) : undefined}
        />
      </div>

      <form action={createSupplier} className="mt-6 max-w-[860px] space-y-8">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-[13px] font-medium text-muted"
          >
            Tên nhà cung cấp
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={255}
            autoComplete="organization"
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-[13px] font-medium text-muted"
            >
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              maxLength={30}
              autoComplete="tel"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-medium text-muted"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              maxLength={255}
              autoComplete="email"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="address"
            className="mb-1.5 block text-[13px] font-medium text-muted"
          >
            Địa chỉ
          </label>
          <input
            id="address"
            name="address"
            maxLength={255}
            autoComplete="street-address"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="taxCode"
            className="mb-1.5 block text-[13px] font-medium text-muted"
          >
            Mã số thuế
          </label>
          <input
            id="taxCode"
            name="taxCode"
            maxLength={50}
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
          <button
            type="submit"
            className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
          >
            Tạo nhà cung cấp
          </button>
          <Link
            href="/suppliers"
            className="border border-rule px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-ink"
          >
            Huỷ
          </Link>
        </div>
      </form>
    </WorkspacePage>
  );
}

export default function NewSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewSupplierForm searchParams={searchParams} />
    </Suspense>
  );
}
