import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  WorkspacePage,
  WorkspaceShell,
} from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { displayName, fetchCurrentUser } from '@/lib/account';
import { fetchDeliveryContact } from '@/lib/delivery-contact';
import { saveDeliveryContactAction } from './actions';

const CELL_CLASS = 'bg-paper px-5 py-4';
const LABEL_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.16em] text-muted';
const VALUE_CLASS = 'mt-1 text-[14px]';
const FIELD_LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

const MESSAGES: Record<string, string> = {
  'delivery-missing': 'Nhập ít nhất số điện thoại hoặc địa chỉ giao hàng.',
  server: 'Không lưu được thông tin giao hàng. Vui lòng thử lại.',
};

type SearchParams = {
  error?: string;
  updated?: string;
};

async function AccountContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/account');

  const contact = await fetchDeliveryContact();

  const message = params.error
    ? (MESSAGES[params.error] ?? MESSAGES.server)
    : params.updated === 'delivery'
      ? 'Đã lưu thông tin giao hàng.'
      : undefined;

  return (
    <WorkspaceShell>
      <WorkspacePage
        eyebrow="Tài khoản"
        title={displayName(user)}
        intro="Thông tin đăng nhập, quyền và địa chỉ giao hàng của bạn."
      >
        <dl className="grid max-w-[620px] grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2">
          <div className={CELL_CLASS}>
            <dt className={LABEL_CLASS}>Họ tên</dt>
            <dd className={VALUE_CLASS}>{displayName(user)}</dd>
          </div>

          <div className={CELL_CLASS}>
            <dt className={LABEL_CLASS}>Email</dt>
            <dd className={`${VALUE_CLASS} break-all`}>{user.email}</dd>
          </div>

          <div className={CELL_CLASS}>
            <dt className={LABEL_CLASS}>Vai trò</dt>
            <dd className={VALUE_CLASS}>
              {user.isSuperAdmin ? 'Super Admin' : 'Thành viên'}
            </dd>
          </div>

          <div className={CELL_CLASS}>
            <dt className={LABEL_CLASS}>Quyền</dt>
            <dd className={VALUE_CLASS}>
              {user.isSuperAdmin
                ? 'Toàn quyền'
                : `${user.permissions.length} quyền`}
            </dd>
          </div>
        </dl>

        <section className="mt-10 max-w-[620px] border-t border-rule pt-6">
          <h2 className="text-[15px] font-semibold">Thông tin giao hàng</h2>
          <p className="mt-1 text-[13px] text-muted">
            Lưu riêng cho lần đặt hàng. Có thể lưu chỉ số điện thoại, chỉ địa
            chỉ, hoặc cả hai.
          </p>

          <div className="mt-5">
            <FormMessage
              message={message}
              tone={params.updated === 'delivery' && !params.error ? 'success' : 'error'}
            />
          </div>

          <form action={saveDeliveryContactAction} className="mt-2 grid gap-4">
            <label className={FIELD_LABEL_CLASS}>
              Số điện thoại giao hàng
              <input
                name="phone"
                type="tel"
                maxLength={30}
                defaultValue={contact.phone ?? ''}
                placeholder="0901234567"
                className={INPUT_CLASS}
              />
            </label>

            <label className={FIELD_LABEL_CLASS}>
              Địa chỉ giao hàng
              <textarea
                name="address"
                rows={3}
                maxLength={500}
                defaultValue={contact.address ?? ''}
                placeholder="Số nhà, tên đường, phường/quận, thành phố"
                className={`${INPUT_CLASS} resize-y`}
              />
            </label>

            <div>
              <button
                type="submit"
                className="border border-ink bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper hover:bg-accent"
              >
                Lưu thông tin giao hàng
              </button>
            </div>
          </form>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/account/password"
            className="border border-ink px-4 py-2.5 text-[13px] font-semibold hover:bg-ink hover:text-paper"
          >
            Đổi mật khẩu
          </Link>

          <Link
            href="/dashboard"
            className="border border-rule px-4 py-2.5 text-[13px] font-medium hover:border-ink"
          >
            Không gian làm việc
          </Link>
        </div>
      </WorkspacePage>
    </WorkspaceShell>
  );
}

export default function AccountPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AccountContent searchParams={searchParams} />
    </Suspense>
  );
}
